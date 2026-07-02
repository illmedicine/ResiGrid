"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, doc, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";
import { CheckCircle2, Clock, FileText, PenLine } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { leaseTermsCol, messageThreadsCol, threadMessagesCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { LeaseTermsDoc } from "@/lib/types/models";

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
  const [lease, setLease] = useState<LeaseTermsDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [sigName, setSigName] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const q = query(leaseTermsCol(), where("tenantId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map((d) => ({ ...d.data(), id: d.id } as LeaseTermsDoc))
        .sort((a, b) => b.createdAt - a.createdAt);
      const active =
        docs.find((l) => ["sent", "tenant_signed", "fully_signed"].includes(l.status)) ??
        docs[0] ??
        null;
      setLease(active);
      setLoading(false);
    }, () => setLoading(false));
  }, [user]);

  // Mark viewed on first load of a sent lease → notify PM
  useEffect(() => {
    if (!lease || !user || viewedRef.current || lease.status !== "sent" || lease.viewedAt) return;
    viewedRef.current = true;
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

          {/* Lease terms */}
          <Card className="p-5">
            <CardContent className="flex flex-col gap-4 p-0">
              <h2 className="text-sm font-semibold text-navy-900">Lease Terms</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-neutral-500">Tenant</dt>
                  <dd className="font-medium text-navy-900">{lease.tenantName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Term</dt>
                  <dd className="font-medium text-navy-900">{lease.termType}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Start date</dt>
                  <dd className="font-medium text-navy-900">{new Date(lease.startDate).toLocaleDateString()}</dd>
                </div>
                {lease.endDate && (
                  <div>
                    <dt className="text-xs text-neutral-500">End date</dt>
                    <dd className="font-medium text-navy-900">{new Date(lease.endDate).toLocaleDateString()}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-neutral-500">Monthly rent</dt>
                  <dd className="font-medium text-navy-900">${lease.rent.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Security deposit</dt>
                  <dd className="font-medium text-navy-900">${lease.securityDeposit.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Move-in fee</dt>
                  <dd className="font-medium text-navy-900">${lease.moveInFee.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Late fee</dt>
                  <dd className="font-medium text-navy-900">${lease.lateFeeAmount} after {lease.lateFeeDays} days</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Pets</dt>
                  <dd className="font-medium text-navy-900">{lease.pets.allowed ? `Allowed (max ${lease.pets.maxCount})` : "Not allowed"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Smoking</dt>
                  <dd className="font-medium text-navy-900">{lease.smokingAllowed ? "Allowed" : "Not allowed"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Parking</dt>
                  <dd className="font-medium text-navy-900">
                    {lease.parking.type === "none" ? "None" :
                     lease.parking.type === "included" ? "Included" :
                     `Paid — $${lease.parking.monthlyFee}/mo`}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Quiet hours</dt>
                  <dd className="font-medium text-navy-900">{lease.quietHoursStart} – {lease.quietHoursEnd}</dd>
                </div>
              </dl>
              {lease.additionalTerms && (
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">Additional terms</p>
                  <p className="text-sm text-navy-900 whitespace-pre-wrap">{lease.additionalTerms}</p>
                </div>
              )}
            </CardContent>
          </Card>

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
