"use client";

import { useEffect, useState } from "react";
import {
  type DocumentData,
  type QueryDocumentSnapshot,
  addDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { FileText, Home, Loader2, Search, Star, Users, X } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { leaseTermsCol, tenantReviewsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useEffectivePMId } from "@/lib/hooks/useEffectivePMId";
import { useOwnerProperties } from "@/lib/hooks/useOwnerProperties";
import { useTenantRowStats } from "@/lib/hooks/useTenantRowStats";
import { useCurrentRentInvoice } from "@/lib/hooks/useCurrentRentInvoice";
import { computeTenantMood } from "@/lib/tenants/mood";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { RGEBadgeChip } from "@/components/shared/RGEBadgeChip";
import type { LeaseTermsDoc, PropertyDoc, UnitDoc, UserDoc } from "@/lib/types/models";

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

  const propertiesById = Object.fromEntries(properties.map((p) => [p.id, p]));

  // How many loaded leases belong to the same tenant — surfaced as a badge so
  // a PM can immediately see a tenant renting across multiple properties.
  const leaseCountByTenant: Record<string, number> = {};
  for (const l of leases) {
    if (!l.tenantId) continue;
    leaseCountByTenant[l.tenantId] = (leaseCountByTenant[l.tenantId] ?? 0) + 1;
  }

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
        const propertyName = propertiesById[l.propertyId]?.name?.toLowerCase() ?? "";
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
              property={propertiesById[lease.propertyId]}
              unit={units[lease.unitId]}
              leaseCount={lease.tenantId ? leaseCountByTenant[lease.tenantId] ?? 1 : 1}
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
  property,
  unit,
  leaseCount,
}: {
  lease: LeaseTermsDoc;
  tenantName?: string;
  property?: PropertyDoc;
  unit?: UnitDoc;
  leaseCount: number;
}) {
  const stats = useTenantRowStats(lease.tenantId ?? "", lease.pmId);
  const { invoice } = useCurrentRentInvoice(lease.id, lease.startDate);
  const [showRateModal, setShowRateModal] = useState(false);

  const { emoji, label } = computeTenantMood({
    leaseStartDate: lease.startDate,
    lateFeeDays: lease.lateFeeDays,
    tenantSignedAt: lease.tenantSignedAt,
    pmSignedAt: lease.pmSignedAt,
    lastCompletedPaymentAt: stats.lastCompletedPaymentAt ?? undefined,
    hasUrgentOpenMaintenance: stats.hasUrgentOpenMaintenance,
    currentInvoiceDueDate: invoice?.dueDate,
    currentInvoiceStatus: invoice?.status,
  });

  const tenureLabel = stats.tenantCreatedAt
    ? formatTenure(Date.now() - stats.tenantCreatedAt)
    : "—";

  // +1 for the lease itself — a signed tenant always has at least their lease
  // on file, even before any separate uploads or applications.
  const docsTotal = stats.loading ? null : stats.docsSubmitted + 1;
  const photo = property?.photos?.[0];

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-3 pl-0">
        {/* Property thumbnail banner */}
        <div className="relative h-16 w-24 shrink-0 overflow-hidden bg-navy-900/5">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Home className="h-5 w-5 text-navy-900/20" />
            </div>
          )}
          <span
            title={label}
            className="absolute bottom-0.5 right-0.5 text-lg leading-none drop-shadow"
          >
            {emoji}
          </span>
        </div>

        <div className="min-w-[140px] flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-navy-900">
              {tenantName ?? lease.tenantId ?? "—"}
            </p>
            {leaseCount > 1 && (
              <Badge tone="orange">{leaseCount} properties</Badge>
            )}
          </div>
          <p className="text-xs text-neutral-500">
            {property?.name ?? "—"}
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
          value={docsTotal == null ? "…" : String(docsTotal)}
          icon={FileText}
        />
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-wide text-neutral-400">RGE</span>
          {stats.loading ? (
            <span className="text-sm font-semibold text-navy-900">…</span>
          ) : (
            <RGEBadgeChip score={stats.score} badges={stats.badges} />
          )}
        </div>

        <div className="ml-auto flex gap-2 shrink-0">
          <Button href="/pm/messages" size="sm" variant="outline">
            Message
          </Button>
          <Button href={`/pm/leases/view?id=${lease.id}`} size="sm" variant="outline">
            View lease
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowRateModal(true)}>
            Rate tenant
          </Button>
        </div>
      </CardContent>
      {showRateModal && (
        <RateTenantModal
          tenantId={lease.tenantId ?? ""}
          pmId={lease.pmId}
          onClose={() => setShowRateModal(false)}
        />
      )}
    </Card>
  );
}

function RateTenantModal({
  tenantId,
  pmId,
  onClose,
}: {
  tenantId: string;
  pmId: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (rating < 1) return;
    setSubmitting(true);
    setError(null);
    try {
      await addDoc(tenantReviewsCol(), {
        id: "",
        tenantId,
        pmId,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
        createdAt: Date.now(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit that review.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4">
      <Card className="w-full max-w-sm p-5">
        <CardContent className="flex flex-col gap-4 p-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-navy-900">Rate this tenant</h3>
            <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)}>
                <Star
                  className={`h-6 w-6 ${n <= rating ? "fill-orange-400 text-orange-400" : "text-neutral-300"}`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment"
            rows={3}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-navy-900 placeholder:text-neutral-600/60 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button onClick={handleSubmit} disabled={rating < 1 || submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit review"}
          </Button>
          <p className="text-[10px] text-neutral-400">
            3★ and up adds RGE credit for this tenant, once every 30 days.
          </p>
        </CardContent>
      </Card>
    </div>
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
