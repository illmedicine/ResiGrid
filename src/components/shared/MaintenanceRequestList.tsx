"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { maintenanceRequestsCol } from "@/lib/firebase/firestore";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { MaintenanceRequestDoc, MaintenanceStatus } from "@/lib/types/models";

const statusTone: Record<MaintenanceStatus, "neutral" | "warning" | "success" | "navy"> = {
  submitted: "neutral",
  acknowledged: "navy",
  in_progress: "warning",
  resolved: "success",
  closed: "neutral",
};

interface Props {
  scope: "tenant" | "property";
  scopeId: string;
  /** When true tenant can add/edit tenantNotes */
  allowTenantNotes?: boolean;
}

function RequestRow({ req, allowTenantNotes }: { req: MaintenanceRequestDoc; allowTenantNotes?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [tenantNotes, setTenantNotes] = useState(req.tenantNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Keep local state in sync when Firestore pushes an update to this request.
  useEffect(() => {
    if (!saving) setTenantNotes(req.tenantNotes ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req.tenantNotes]);

  async function handleSaveNotes() {
    setSaving(true);
    setSaveError(null);
    try {
      await updateDoc(doc(db, "maintenanceRequests", req.id), { tenantNotes });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-2 p-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-navy-900">{req.category} — {req.item}</p>
            {req.affectedRoom && <p className="text-xs text-neutral-500">Room: {req.affectedRoom}</p>}
            <p className="text-xs text-neutral-600">
              {new Date(req.createdAt).toLocaleDateString()} · {req.priority} priority
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge tone={statusTone[req.status]}>{req.status.replace(/_/g, " ")}</Badge>
            <button type="button" onClick={() => setExpanded((v) => !v)} className="text-neutral-400 hover:text-navy-900">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-600 whitespace-pre-wrap">{req.description}</p>

        {expanded && (
          <div className="flex flex-col gap-3 border-t border-neutral-100 pt-3">
            {req.photoUrls?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {req.photoUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />
                  </a>
                ))}
              </div>
            )}

            {req.pmNotes && (
              <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
                <p className="mb-0.5 text-xs font-medium text-orange-700">Message from your property manager</p>
                <p className="text-xs text-orange-900 whitespace-pre-wrap">{req.pmNotes}</p>
              </div>
            )}

            {allowTenantNotes && (
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-700">Your notes (visible to property manager)</p>
                <textarea
                  value={tenantNotes}
                  onChange={(e) => { setTenantNotes(e.target.value); setSaved(false); }}
                  rows={3}
                  placeholder="Add any notes or updates…"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                <Button size="sm" variant="outline" className="mt-1.5" onClick={handleSaveNotes} disabled={saving}>
                  {saved ? "Saved!" : saving ? "Saving…" : "Save note"}
                </Button>
                {saveError && <p className="mt-1 text-xs text-red-600">{saveError}</p>}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MaintenanceRequestList({ scope, scopeId, allowTenantNotes }: Props) {
  const [requests, setRequests] = useState<MaintenanceRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const field = scope === "tenant" ? "tenantId" : "propertyId";
    const q = query(maintenanceRequestsCol(), where(field, "==", scopeId));
    return onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ ...d.data(), id: d.id } as MaintenanceRequestDoc)).sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, () => setLoading(false));
  }, [scope, scopeId]);

  if (loading) return <p className="text-sm text-neutral-600">Loading requests…</p>;
  if (requests.length === 0) return (
    <Card className="p-5"><CardContent className="p-0"><p className="text-sm text-neutral-600">No maintenance requests yet.</p></CardContent></Card>
  );

  return (
    <div className="flex flex-col gap-2">
      {requests.map((req) => <RequestRow key={req.id} req={req} allowTenantNotes={allowTenantNotes} />)}
    </div>
  );
}
