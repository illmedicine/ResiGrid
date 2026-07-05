"use client";

import { useEffect, useState } from "react";
import {
  type DocumentData,
  type QueryDocumentSnapshot,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { FileText, Search, Users } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { leaseTermsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useEffectivePMId } from "@/lib/hooks/useEffectivePMId";
import { useOwnerProperties } from "@/lib/hooks/useOwnerProperties";
import { useTenantRowStats } from "@/lib/hooks/useTenantRowStats";
import { computeTenantMood } from "@/lib/tenants/mood";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { LeaseTermsDoc, UnitDoc, UserDoc } from "@/lib/types/models";

const PAGE_SIZE = 25;

export default function PmTenantsPage() {
  const { user } = useAuth();
  const { effectiveId } = useEffectivePMId();
  const { properties } = useOwnerProperties(user?.uid);
  const queryId = user ? (effectiveId ?? user.uid) : undefined;

  const [leases, setLeases] = useState<LeaseTermsDoc[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, UnitDoc>>({});
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");

  const propertiesById = Object.fromEntries(properties.map((p) => [p.id, p.name]));

  async function loadPage(after: QueryDocumentSnapshot<DocumentData> | null) {
    if (!queryId) return;
    const constraints = [
      where("pmId", "==", queryId),
      where("status", "==", "fully_signed" as const),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE),
      ...(after ? [startAfter(after)] : []),
    ];
    const snap = await getDocs(query(leaseTermsCol(), ...constraints));
    const newLeases = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as LeaseTermsDoc);

    const [userDocs, unitDocs] = await Promise.all([
      Promise.all(
        newLeases.map((l) =>
          l.tenantId ? getDoc(doc(db, "users", l.tenantId)) : Promise.resolve(null),
        ),
      ),
      Promise.all(newLeases.map((l) => getDoc(doc(db, "units", l.unitId)))),
    ]);

    setNames((prev) => {
      const next = { ...prev };
      newLeases.forEach((l, i) => {
        const snap = userDocs[i];
        if (l.tenantId && snap?.exists()) next[l.tenantId] = (snap.data() as UserDoc).displayName;
      });
      return next;
    });
    setUnits((prev) => {
      const next = { ...prev };
      newLeases.forEach((l, i) => {
        const snap = unitDocs[i];
        if (snap?.exists()) next[l.unitId] = { ...(snap.data() as UnitDoc), id: snap.id };
      });
      return next;
    });

    setLeases((prev) => (after ? [...prev, ...newLeases] : newLeases));
    setCursor(snap.docs[snap.docs.length - 1] ?? null);
    setHasMore(snap.docs.length === PAGE_SIZE);
  }

  useEffect(() => {
    if (!queryId) return;
    setLoading(true);
    loadPage(null).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId]);

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      await loadPage(cursor);
    } finally {
      setLoadingMore(false);
    }
  }

  const term = search.trim().toLowerCase();
  const filtered = term
    ? leases.filter((l) => {
        const name = names[l.tenantId ?? ""]?.toLowerCase() ?? "";
        const propertyName = propertiesById[l.propertyId]?.toLowerCase() ?? "";
        const unitNumber = units[l.unitId]?.unitNumber?.toLowerCase() ?? "";
        return (
          name.includes(term) ||
          propertyName.includes(term) ||
          unitNumber.includes(term) ||
          (l.tenantId ?? "").toLowerCase().includes(term)
        );
      })
    : leases;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Tenants</h1>
        <p className="text-sm text-neutral-600">
          Every tenant with a fully signed lease, across all your properties — appears
          here automatically, no manual assignment needed.
        </p>
      </div>

      {!loading && leases.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search loaded tenants by name, property, or unit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : leases.length === 0 ? (
        <Card className="p-8">
          <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
            <Users className="h-10 w-10 text-neutral-300" />
            <p className="text-sm font-semibold text-navy-900">No tenants yet</p>
            <p className="text-xs text-neutral-500">
              Tenants show up here automatically once a lease is fully signed through
              the application &amp; lease workflow.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((lease) => (
            <TenantDashboardRow
              key={lease.id}
              lease={lease}
              tenantName={lease.tenantId ? names[lease.tenantId] : undefined}
              propertyName={propertiesById[lease.propertyId]}
              unit={units[lease.unitId]}
            />
          ))}
        </div>
      )}

      {hasMore && !term && (
        <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loadingMore} className="w-fit">
          {loadingMore ? "Loading…" : "Load more tenants"}
        </Button>
      )}
    </div>
  );
}

function TenantDashboardRow({
  lease,
  tenantName,
  propertyName,
  unit,
}: {
  lease: LeaseTermsDoc;
  tenantName?: string;
  propertyName?: string;
  unit?: UnitDoc;
}) {
  const stats = useTenantRowStats(lease.tenantId ?? "", lease.pmId);

  const { emoji, label } = computeTenantMood({
    leaseStartDate: lease.startDate,
    lateFeeDays: lease.lateFeeDays,
    tenantSignedAt: lease.tenantSignedAt,
    pmSignedAt: lease.pmSignedAt,
    lastCompletedPaymentAt: stats.lastCompletedPaymentAt ?? undefined,
    hasUrgentOpenMaintenance: stats.hasUrgentOpenMaintenance,
  });

  const tenureLabel = stats.tenantCreatedAt
    ? formatTenure(Date.now() - stats.tenantCreatedAt)
    : "—";

  return (
    <Card className="p-3">
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-0">
        <span title={label} className="text-2xl leading-none shrink-0">
          {emoji}
        </span>

        <div className="min-w-[140px] flex-1">
          <p className="text-sm font-semibold text-navy-900">
            {tenantName ?? lease.tenantId ?? "—"}
          </p>
          <p className="text-xs text-neutral-500">
            {propertyName ?? "—"}
            {unit ? ` · Unit ${unit.unitNumber}` : ""}
          </p>
        </div>

        <Stat label="On platform" value={tenureLabel} />
        <Stat
          label="Total paid"
          value={stats.loading ? "…" : `$${stats.totalPaid.toLocaleString()}`}
        />
        <Stat
          label="Docs"
          value={stats.loading ? "…" : String(stats.docsSubmitted)}
          icon={FileText}
        />
        <Stat
          label="RGE score"
          value={stats.loading ? "…" : stats.score != null ? `${stats.score}%` : "—"}
        />

        <div className="ml-auto flex gap-2 shrink-0">
          <Button href="/pm/messages" size="sm" variant="outline">
            Message
          </Button>
          <Button href={`/pm/leases/view?id=${lease.id}`} size="sm" variant="outline">
            View lease
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof FileText;
}) {
  return (
    <div className="flex flex-col items-start">
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-neutral-400">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      <span className="text-sm font-semibold text-navy-900">{value}</span>
    </div>
  );
}

function formatTenure(ms: number): string {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return months > 0 ? `${years}y ${months}mo` : `${years}y`;
}
