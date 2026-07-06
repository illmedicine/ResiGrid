"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { CheckCircle2, Clock, FileText, PenLine } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { messageThreadsCol, threadMessagesCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useTenantLeaseContext } from "@/lib/context/TenantLeaseContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LeasePreviewDoc } from "@/components/pm/lease/LeasePreviewDoc";
import { cn } from "@/lib/utils/cn";

const SIGN_WINDOW_MS = 48 * 60 * 60 * 1000;

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

async function sendDM(pmId: string, tenantId: string, senderId: string, content: string) {
  const threadId = [pmId, tenantId].sort().join("_");
  const threadRef = doc(messageThreadsCol(), threadId);
  await setDoc(threadRef, {
    id: threadId,
    participantIds: [pmId, tenantId],
    lastMessageAt: Date.now(),
    lastMessageSnippet: content.slice(0, 80),
  }, { merge: true });
  await addDoc(threadMessagesCol(threadId), {
    id: "",
    threadId,
    senderId,
    content,
    createdAt: Date.now(),
    readBy: [senderId],
  });
}

export default function TenantLeasePage() {
  const { user } = useAuth();
  const { leases, pendingLeases, activeLeases, loading } = useTenantLeaseContext();
  const [viewingLeaseId, setViewingLeaseId] = useState<string | null>(null);
  const [sigName, setSigName] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const viewedRef = useRef<string | null>(null);

  // Every lease that's actually been sent to the tenant (drafts are PM-only).
  const reviewable = leases.filter((l) => l.lease.status !== "draft");

  // Default to a lease that still needs the tenant's signature, else the
  // most recently signed one.
  useEffect(() => {
    if (loading) return;
    if (viewingLeaseId && reviewable.some((l) => l.lease.id === viewingLeaseId)) return;
    const def = pendingLeases[0] ?? activeLeases[0] ?? reviewable[0] ?? null;
    setViewingLeaseId(def?.lease.id ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pendingLeases, activeLeases, reviewable, viewingLeaseId]);

  const viewing = reviewable.find((l) => l.lease.id === viewingLeaseId) ?? null;
  const lease = viewing?.lease ?? null;

  // Mark viewed on first load of a sent lease → notify PM
  useEffect(() => {
    if (!lease || !user || viewedRef.current === lease.id || lease.status !== "sent" || lease.viewedAt) return;
    viewedRef.current = lease.id;
    updateDoc(doc(db, "leaseTerms", lease.id), { viewedAt: Date.now() })
      .then(() => {
        if (lease.pmId) {
          sendDM(lease.pmId, user.uid, user.uid,
            "📋 Your tenant has viewed the lease agreement and is reviewing it.").catch(() => {});
        }
      })
      .catch(() => {});
  }, [lease, user]);

  const deadline = lease?.sentAt ? lease.sentAt + SIGN_WINDOW_MS : undefined;
  const remaining = useCountdown(deadline);
  const isExpired = lease?.status === "sent" && remaining !== null && remaining === 0;

  async function handleSign() {
    if (!lease || !user || !sigName.trim()) return;
    setSigning(true);
    try {
      await updateDoc(doc(db, "leaseTerms", lease.id), {
        status: "tenant_signed",
        tenantSignedAt: Date.now(),
        tenantSignatureName: sigName.trim(),
      });
      if (lease.pmId) {
        await sendDM(lease.pmId, user.uid, user.uid,
          `✅ ${sigName.trim()} has signed the lease agreement for unit ${lease.unitId}. Please review and countersign to finalize.`);
      }
      setSigned(true);
    } finally {
      setSigning(false);
    }
  }

  const isSent = lease?.status === "sent";
  const isTenantSigned = lease?.status === "tenant_signed";
  const isFullySigned = lease?.status === "fully_signed";

  return (
    <div className="flex flex-col gap-4">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap');`}</style>
      <div>
        <h1 className="text-xl font-bold text-navy-900">Lease Agreement</h1>
        <p className="text-sm text-neutral-600">Review and sign your lease.</p>
      </div>

      {/* Lease picker — only shown when there's more than one to review */}
      {reviewable.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {reviewable.map(({ lease: l, property, unit }) => (
            <button
              key={l.id}
              type="button"
              onClick={() => { setViewingLeaseId(l.id); setSigned(false); setSigName(""); }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                l.id === viewingLeaseId
                  ? "border-orange-400 bg-orange-50 text-orange-700"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-orange-200",
              )}
            >
              {property?.name ?? "Property"}{unit ? ` · Unit ${unit.unitNumber}` : ""}
              {(l.status === "sent" || l.status === "tenant_signed") && (
                <span className="ml-1.5 text-orange-500">●</span>
              )}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : !lease ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">
              No lease on file yet. Your property manager will send one once your application is approved.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Status header */}
          <Card className="p-4">
            <CardContent className="flex items-center justify-between gap-3 p-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-semibold text-navy-900">Lease agreement</span>
              </div>
              <Badge tone={
                isFullySigned ? "success" :
                isTenantSigned ? "warning" :
                isExpired ? "danger" : "navy"
              }>
                {isFullySigned ? "Fully signed" :
                 isTenantSigned ? "Pending countersign" :
                 isExpired ? "Expired" :
                 "Awaiting your signature"}
              </Badge>
            </CardContent>
          </Card>

          {/* Countdown timer */}
          {isSent && !isExpired && remaining !== null && (
            <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
              <Clock className="h-4 w-4 shrink-0 text-orange-500" />
              <span className="text-sm text-orange-800">
                Time to sign:{" "}
                <span className="font-mono font-bold">{formatCountdown(remaining)}</span>
                {" "}— offer expires in 48 hours from when it was sent.
              </span>
            </div>
          )}
          {isExpired && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                This lease offer expired. Contact your property manager to resend it.
              </p>
            </div>
          )}

          {/* Full lease document with signatures */}
          <LeasePreviewDoc lease={lease} />

          {/* Signature adoption */}
          {isSent && !isExpired && !signed && (
            <Card className="p-5">
              <CardContent className="flex flex-col gap-4 p-0">
                <div className="flex items-center gap-2">
                  <PenLine className="h-5 w-5 text-orange-500" />
                  <h2 className="text-sm font-semibold text-navy-900">Sign this lease</h2>
                </div>
                <p className="text-xs text-neutral-600">
                  Type your full legal name to adopt it as your electronic signature.
                  By signing you agree to all terms above.
                </p>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-700">Full legal name</label>
                  <input
                    type="text"
                    value={sigName}
                    onChange={(e) => setSigName(e.target.value)}
                    placeholder="e.g. Jordan Smith"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                {sigName.trim() && (
                  <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 px-5 py-4">
                    <p className="mb-1 text-xs text-neutral-500">Signature preview</p>
                    <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: "2rem", lineHeight: 1.3, color: "#0b1f3a" }}>
                      {sigName}
                    </p>
                  </div>
                )}
                <Button onClick={handleSign} disabled={signing || !sigName.trim()} className="w-full">
                  {signing ? "Signing…" : "Sign lease agreement"}
                </Button>
                <p className="text-center text-xs text-neutral-400">
                  Legally binding electronic signature under the E-SIGN Act.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Signed confirmation */}
          {(signed || isTenantSigned || isFullySigned) && (
            <Card className="p-5">
              <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
                <p className="font-semibold text-navy-900">
                  {isFullySigned
                    ? "Lease fully executed — welcome home!"
                    : "You've signed! Awaiting your property manager's countersignature."}
                </p>
                {lease.tenantSignedAt && (
                  <p className="text-xs text-neutral-500">
                    Signed {new Date(lease.tenantSignedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
