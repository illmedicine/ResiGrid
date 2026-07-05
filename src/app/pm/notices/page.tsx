"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  addDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { Bell, Building2, Home, Plus, Users } from "lucide-react";
import { noticesCol, propertiesCol, unitsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useEffectivePMId } from "@/lib/hooks/useEffectivePMId";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { NoticeDoc, NoticeScope, PropertyDoc, UnitDoc } from "@/lib/types/models";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});
type FormValues = z.infer<typeof schema>;

type ScopeOption = "all" | "property" | "unit";

const SCOPE_LABELS: Record<ScopeOption, { icon: typeof Bell; label: string; desc: string }> = {
  all: { icon: Users, label: "All tenants", desc: "Everyone across all your properties" },
  property: { icon: Building2, label: "A property", desc: "All tenants in one building" },
  unit: { icon: Home, label: "A unit", desc: "One specific tenant" },
};

function noticeScopeLabel(notice: NoticeDoc, properties: PropertyDoc[], units: UnitDoc[]): string {
  if (notice.scope === "all") return "All tenants";
  if (notice.scope === "property") {
    const p = properties.find((x) => x.id === notice.scopeId);
    return p ? `Building: ${p.name ?? p.addressLine1}` : "Specific property";
  }
  if (notice.scope === "unit") {
    const u = units.find((x) => x.id === notice.scopeId);
    return u ? `Unit ${u.unitNumber}` : "Specific unit";
  }
  return "";
}

export default function PmNoticesPage() {
  const { user } = useAuth();
  const { effectiveId } = useEffectivePMId();
  const [notices, setNotices] = useState<NoticeDoc[]>([]);
  const [properties, setProperties] = useState<PropertyDoc[]>([]);
  const [units, setUnits] = useState<UnitDoc[]>([]);
  const [scopeUnits, setScopeUnits] = useState<UnitDoc[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [scope, setScope] = useState<ScopeOption>("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Load notices
  useEffect(() => {
    if (!effectiveId) return;
    const q = query(
      noticesCol(),
      where("pmId", "==", effectiveId),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(q, (snap) => {
      setNotices(snap.docs.map((d) => ({ ...d.data(), id: d.id } as NoticeDoc)));
    });
  }, [effectiveId]);

  // Load properties for scope selector
  useEffect(() => {
    if (!effectiveId) return;
    const q = query(propertiesCol(), where("ownerId", "==", effectiveId));
    return onSnapshot(q, (snap) => {
      setProperties(snap.docs.map((d) => ({ ...d.data(), id: d.id } as PropertyDoc)));
    });
  }, [effectiveId]);

  // Load all units for label resolution
  useEffect(() => {
    if (!effectiveId) return;
    const unsubs = properties.map((p) => {
      const q = query(unitsCol(), where("propertyId", "==", p.id));
      return onSnapshot(q, (snap) => {
        const fetched = snap.docs.map((d) => ({ ...d.data(), id: d.id } as UnitDoc));
        setUnits((prev) => {
          const without = prev.filter((u) => u.propertyId !== p.id);
          return [...without, ...fetched];
        });
      });
    });
    return () => unsubs.forEach((u) => u());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.length, effectiveId]);

  // Load units for selected property (for unit scope)
  useEffect(() => {
    if (!selectedPropertyId || scope !== "unit") { setScopeUnits([]); setSelectedUnitId(""); return; }
    setScopeUnits(units.filter((u) => u.propertyId === selectedPropertyId));
  }, [selectedPropertyId, scope, units]);

  function resetForm() {
    reset();
    setScope("all");
    setSelectedPropertyId("");
    setSelectedUnitId("");
    setShowForm(false);
  }

  async function onSubmit(values: FormValues) {
    if (!user || !effectiveId) return;
    if (scope === "property" && !selectedPropertyId) return;
    if (scope === "unit" && !selectedUnitId) return;
    setSubmitting(true);
    try {
      await addDoc(noticesCol(), {
        id: "",
        pmId: effectiveId,
        scope: scope as NoticeScope,
        ...(scope === "property" ? { scopeId: selectedPropertyId } : {}),
        ...(scope === "unit" ? { scopeId: selectedUnitId } : {}),
        title: values.title,
        content: values.content,
        createdAt: Date.now(),
      });
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Notices</h1>
          <p className="text-sm text-neutral-600">
            Post announcements to your tenants — delivered in-app and by email.
          </p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            New notice
          </Button>
        )}
      </div>

      {/* Compose form */}
      {showForm && (
        <Card className="p-5">
          <CardContent className="p-0">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-navy-900">Compose notice</h2>

              {/* Scope selector */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-neutral-600">Who receives this?</p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(SCOPE_LABELS) as ScopeOption[]).map((s) => {
                    const { icon: Icon, label, desc } = SCOPE_LABELS[s];
                    const active = scope === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setScope(s); setSelectedPropertyId(""); setSelectedUnitId(""); }}
                        className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition ${
                          active
                            ? "border-orange-400 bg-orange-50"
                            : "border-neutral-200 bg-white hover:border-neutral-300"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${active ? "text-orange-500" : "text-neutral-400"}`} />
                        <p className={`text-xs font-semibold leading-none ${active ? "text-orange-700" : "text-navy-900"}`}>
                          {label}
                        </p>
                        <p className="text-[10px] leading-tight text-neutral-500">{desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Property selector */}
              {(scope === "property" || scope === "unit") && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-600">Select property</label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">Choose a property…</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name ?? p.addressLine1}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Unit selector */}
              {scope === "unit" && selectedPropertyId && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-600">Select unit</label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">Choose a unit…</option>
                    {scopeUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        Unit {u.unitNumber}
                        {u.status === "occupied" ? " (occupied)" : " (vacant)"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Input label="Title" {...register("title")} error={errors.title?.message} />
              <Textarea
                label="Message"
                rows={4}
                {...register("content")}
                error={errors.content?.message}
              />

              <div className="flex gap-2 border-t border-neutral-100 pt-2">
                <Button type="submit" disabled={submitting} size="sm">
                  {submitting ? "Sending…" : "Post notice"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notices list */}
      {notices.length === 0 && !showForm ? (
        <Card className="p-8">
          <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
            <span className="rounded-full bg-neutral-100 p-4 text-neutral-400">
              <Bell className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy-900">No notices yet</p>
              <p className="text-xs text-neutral-500">
                Post an announcement and your tenants will be notified in-app and by email.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {notices.map((notice) => (
            <Card key={notice.id} className="p-4">
              <CardContent className="flex flex-col gap-2 p-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-navy-900">{notice.title}</p>
                  <Badge tone="neutral" className="shrink-0 text-[10px]">
                    {noticeScopeLabel(notice, properties, units)}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-neutral-600">{notice.content}</p>
                <p className="text-xs text-neutral-400">
                  {new Date(notice.createdAt).toLocaleDateString(undefined, {
                    weekday: "short", month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
