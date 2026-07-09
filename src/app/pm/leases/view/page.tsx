"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { addDoc, doc, onSnapshot, setDoc, updateDoc, query, collection, where, getDocs } from "firebase/firestore";
import { CheckCircle2, Clock, Eye, Send } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { messageThreadsCol, threadMessagesCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { LeasePreviewDoc } from "@/components/pm/lease/LeasePreviewDoc";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RGEBadgeChip } from "@/components/shared/RGEBadgeChip";
import type { LeaseTermsDoc } from "@/lib/types/models";

const SIGN_WINDOW_MS = 48 * 60 * 60 * 1000;

const STATUS_TONE = {
  draft: "neutral",
  sent: "navy",
  tenant_signed: "warning",
  fully_signed: "success",
  expired: "danger",
} as const;

function useCountdown(deadlineMs: number | undefined) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!deadlineMs) return;
    const tick = () => setRemaining(Math.max(0, deadlineMs - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineMs]);
  return remaining;
}

function formatCountdown(ms: number) {
  const h = Math.floor(ms / 3600000).toString().padStart(2, "0");
  const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, "0");
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function LeaseViewContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, userDoc } = useAuth();
  const id = params.get("id");
  const [lease, setLease] = useState<LeaseTermsDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [countersigning, setCountersigning] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    return onSnapshot(doc(db, "leaseTerms", id), (snap) => {
      if (!snap.exists()) { setLease(null); setLoading(false); return; }
      const data = { ...snap.data(), id: snap.id } as LeaseTermsDoc;
      setLease(data);
      setLoading(false);
      // Auto-repair: if fully_signed but pmSignedAt was never written, backfill it now.
      if (data.status === "fully_signed" && !data.pmSignedAt) {
        updateDoc(doc(db, "leaseTerms", id), {
          pmSignedAt: data.tenantSignedAt ?? Date.now(),
          pmDisplayName: data.pmDisplayName ?? "Property Manager",
        });
      }
      // Auto-repair: ensure unit has currentTenantId set and mark listing as filled.
      if (data.status === "fully_signed" && data.unitId && data.tenantId) {
        updateDoc(doc(db, "units", data.unitId), {
          status: "occupied",
          currentTenantId: data.tenantId,
          currentLeaseId: id,
        });
        // Mark listing as filled when unit is occupied
        const listingQuery = query(collection(db, "listings"), where("unitId", "==", data.unitId));
        getDocs(listingQuery).then((snap) => {
          snap.docs.forEach((listingDoc) => {
            updateDoc(doc(db, "listings", listingDoc.id), { status: "filled" });
          });
        });
      }
    });
  }, [id]);

  // Must be before any early returns to satisfy Rules of Hooks
  const deadline = lease?.sentAt ? lease.sentAt + SIGN_WINDOW_MS : undefined;
  const remaining = useCountdown(deadline);
  const isExpired = lease?.status === "sent" && remaining !== null && remaining === 0;

  async function handleSend() {
    if (!id || !lease || !user) return;
    const now = Date.now();
    await updateDoc(doc(db, "leaseTerms", id), {
      status: "sent",
      sentAt: now,
      signDeadline: now + SIGN_WINDOW_MS,
    });
    if (lease.tenantId) {
      const threadId = [user.uid, lease.tenantId].sort().join("_");
      const threadRef = doc(messageThreadsCol(), threadId);
      const msg = `📄 Your lease agreement is ready to sign. You have 48 hours to review and sign before it expires. Log in to your ResiGrid tenant portal to sign.`;
      await setDoc(threadRef, {
        id: threadId,
        participantIds: [user.uid, lease.tenantId],
        lastMessageAt: now,
        lastMessageSnippet: msg.slice(0, 80),
      }, { merge: true });
      await addDoc(threadMessagesCol(threadId), {
        id: "", threadId, senderId: user.uid, content: msg,
        createdAt: now, readBy: [user.uid],
      });
    }
    router.push(`/pm/leases/view/?id=${id}`);
  }

  async function handleCountersign() {
    if (!id || !lease) return;
    setCountersigning(true);
    await updateDoc(doc(db, "leaseTerms", id), {
      status: "fully_signed",
      pmSignedAt: Date.now(),
      pmDisplayName: user?.displayName ?? userDoc?.displayName ?? "Property Manager",
    });
    // Mark unit as occupied so tenant can access maintenance, payments, etc.
    if (lease.unitId && lease.tenantId) {
      await updateDoc(doc(db, "units", lease.unitId), {
        status: "occupied",
        currentTenantId: lease.tenantId,
        currentLeaseId: id,
      });
    }
    setCountersigning(false);
  }

  if (!id) return <p className="text-sm text-neutral-600">No lease specified.</p>;
  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>;
  if (!lease) return <p className="text-sm text-neutral-600">Lease not found.</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Lease Agreement</h1>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-neutral-600">{lease.tenantName} · Unit {lease.unitId}</p>
            {lease.tenantId && <RGEBadgeChip tenantId={lease.tenantId} />}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={STATUS_TONE[lease.status] as "neutral"}>{lease.status.replace(/_/g, " ")}</Badge>
          {lease.status !== "fully_signed" && (
            <Button href="/pm/leases/new" variant="outline" size="sm">New lease</Button>
          )}
          {lease.status === "draft" && (
            <Button size="sm" onClick={handleSend}>
              <Send className="h-4 w-4" /> Send to tenant
            </Button>
          )}
          {(lease.status === "sent" && isExpired) && (
            <Button size="sm" variant="outline" onClick={handleSend}>Resend (new 48h window)</Button>
          )}
          {lease.status === "tenant_signed" && (
            <Button size="sm" onClick={handleCountersign} disabled={countersigning}>
              <CheckCircle2 className="h-4 w-4" />
              {countersigning ? "Signing…" : "Countersign & finalize"}
            </Button>
          )}
        </div>
      </div>

      {/* Status notifications */}
      <div className="flex flex-col gap-2">
        {lease.status === "sent" && !isExpired && remaining !== null && (
          <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
            <Clock className="h-4 w-4 shrink-0 text-orange-500" />
            <span className="text-sm text-orange-800">
              Tenant has <span className="font-mono font-bold">{formatCountdown(remaining)}</span> remaining to sign.
            </span>
          </div>
        )}
        {isExpired && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">Lease offer expired — use the button above to resend.</p>
          </div>
        )}
        {lease.viewedAt && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2">
            <Eye className="h-4 w-4 shrink-0 text-blue-500" />
            <span className="text-xs text-blue-700">
              Tenant viewed on {new Date(lease.viewedAt).toLocaleString()}
            </span>
          </div>
        )}
        {lease.tenantSignedAt && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            <span className="text-xs text-green-700">
              Tenant signed on {new Date(lease.tenantSignedAt).toLocaleString()}
              {lease.status === "tenant_signed" && " — your countersignature is needed."}
            </span>
          </div>
        )}
        {lease.pmSignedAt && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            <span className="text-xs text-green-700">
              Property manager signed on {new Date(lease.pmSignedAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <LeasePreviewDoc lease={lease} pmDisplayName={userDoc?.displayName} />
    </div>
  );
}

export default function PmLeaseViewPage() {
  return (
    <Suspense>
      <LeaseViewContent />
    </Suspense>
  );
}
