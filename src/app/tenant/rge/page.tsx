"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { CheckCircle2, Loader2, Shield, UserPlus, Wallet2 } from "lucide-react";
import { db, functions, storage } from "@/lib/firebase/config";
import { referralsCol, sharedDocumentsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useTenantLeaseContext } from "@/lib/context/TenantLeaseContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ReputationSummary } from "@/components/tenant/ReputationSummary";
import type { ReferralDoc, ReputationScoreDoc } from "@/lib/types/models";

const PAYSTUB_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const REFERRAL_QUARTERLY_CAP = 5;

function currentQuarterKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

interface SubmitReferralResponse {
  referredDisplayName: string;
}

export default function MyRGEPage() {
  const { user } = useAuth();
  const { activeLeases } = useTenantLeaseContext();
  const [score, setScore] = useState<ReputationScoreDoc | null>(null);
  const [referrals, setReferrals] = useState<ReferralDoc[]>([]);
  const [referredNames, setReferredNames] = useState<Record<string, string>>({});
  const [referralInput, setReferralInput] = useState("");
  const [referralSubmitting, setReferralSubmitting] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [uploadingInsuranceLeaseId, setUploadingInsuranceLeaseId] = useState<string | null>(null);
  const [uploadingPaystub, setUploadingPaystub] = useState(false);
  const pendingLeaseRef = useRef<string | null>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);
  const paystubInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "reputationScores", user.uid), (snap) => {
      setScore(snap.exists() ? (snap.data() as ReputationScoreDoc) : null);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(referralsCol(), where("referrerId", "==", user.uid)),
      (snap) => {
        setReferrals(snap.docs.map((d) => d.data()).sort((a, b) => b.createdAt - a.createdAt));
      },
    );
  }, [user]);

  // Resolve display names for referred tenants we haven't looked up yet.
  useEffect(() => {
    const missing = referrals.filter((r) => !(r.referredTenantId in referredNames));
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(
      missing.map(async (r) => {
        const data = (await getDoc(doc(db, "users", r.referredTenantId))).data();
        return [r.referredTenantId, (data?.displayName as string | undefined) ?? r.referredTenantId] as const;
      }),
    ).then((pairs) => {
      if (cancelled) return;
      setReferredNames((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
    });
    return () => {
      cancelled = true;
    };
  }, [referrals, referredNames]);

  async function uploadSharedDoc(file: File, category: "insurance" | "paystub", leaseTermsId?: string) {
    if (!user) return;
    const path = `resigrid/documents/tenant/${user.uid}/${Date.now()}-${file.name}`;
    const sRef = storageRef(storage, path);
    await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);
    const lease = leaseTermsId ? activeLeases.find((l) => l.lease.id === leaseTermsId) : undefined;
    await addDoc(sharedDocumentsCol(), {
      id: "",
      uploaderId: user.uid,
      uploaderRole: "tenant" as const,
      tenantId: user.uid,
      pmId: lease?.lease.pmId ?? "unassigned",
      name: file.name,
      url,
      mimeType: file.type,
      sizeBytes: file.size,
      category,
      ...(leaseTermsId ? { leaseTermsId } : {}),
      createdAt: Date.now(),
    });
  }

  async function handleInsuranceFile(files: FileList | null) {
    const file = files?.[0];
    const leaseTermsId = pendingLeaseRef.current;
    if (!file || !leaseTermsId) return;
    setUploadingInsuranceLeaseId(leaseTermsId);
    try {
      await uploadSharedDoc(file, "insurance", leaseTermsId);
    } finally {
      setUploadingInsuranceLeaseId(null);
      pendingLeaseRef.current = null;
      if (insuranceInputRef.current) insuranceInputRef.current.value = "";
    }
  }

  async function handlePaystubFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploadingPaystub(true);
    try {
      await uploadSharedDoc(file, "paystub");
    } finally {
      setUploadingPaystub(false);
      if (paystubInputRef.current) paystubInputRef.current.value = "";
    }
  }

  async function handleReferralSubmit() {
    const referredTenantId = referralInput.trim();
    if (!referredTenantId) return;
    setReferralError(null);
    setReferralSubmitting(true);
    try {
      const submitReferral = httpsCallable<{ referredTenantId: string }, SubmitReferralResponse>(
        functions,
        "submitReferral",
      );
      await submitReferral({ referredTenantId });
      setReferralInput("");
    } catch (err) {
      setReferralError(err instanceof Error ? err.message : "Couldn't submit that referral.");
    } finally {
      setReferralSubmitting(false);
    }
  }

  const sameQuarter = score?.referralQuarterKey === currentQuarterKey();
  const referralsUsed = sameQuarter ? score?.referralsThisQuarter ?? 0 : 0;
  const referralsRemaining = Math.max(0, REFERRAL_QUARTERLY_CAP - referralsUsed);

  const paystubNextEligibleAt = (score?.lastPaystubAt ?? 0) + PAYSTUB_COOLDOWN_MS;
  const paystubEligible = !score?.lastPaystubAt || Date.now() >= paystubNextEligibleAt;

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-navy-900">My RGE</h1>
        <p className="text-sm text-neutral-600">
          Complete tasks below to grow your Residential Grid Economy score. On-time rent
          payments and 3★+ property manager reviews add RGE automatically — nothing to do there.
        </p>
      </div>

      <ReputationSummary tenantId={user.uid} />

      {/* ── Insurance ── */}
      <Card className="p-5">
        <CardContent className="flex flex-col gap-3 p-0">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            <h2 className="text-sm font-semibold text-navy-900">Renter&apos;s insurance</h2>
          </div>
          <p className="text-xs text-neutral-500">
            Upload proof of an active insurance policy once per lease.
          </p>
          <input
            ref={insuranceInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleInsuranceFile(e.target.files)}
          />
          {activeLeases.length === 0 ? (
            <p className="text-xs text-neutral-500">Sign a lease to unlock this task.</p>
          ) : (
            activeLeases.map(({ lease, property }) => {
              const credited = score?.insuranceLeaseIds?.includes(lease.id) ?? false;
              const uploading = uploadingInsuranceLeaseId === lease.id;
              return (
                <div
                  key={lease.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy-900">{property?.name ?? "Lease"}</p>
                    <p className="text-xs text-neutral-500">
                      {credited ? "Insurance on file — RGE credited" : "No policy on file yet"}
                    </p>
                  </div>
                  {credited ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => {
                        pendingLeaseRef.current = lease.id;
                        insuranceInputRef.current?.click();
                      }}
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* ── Paystub ── */}
      <Card className="p-5">
        <CardContent className="flex flex-col gap-3 p-0">
          <div className="flex items-center gap-2">
            <Wallet2 className="h-5 w-5 text-orange-500" />
            <h2 className="text-sm font-semibold text-navy-900">Paystub</h2>
          </div>
          <p className="text-xs text-neutral-500">
            Upload a recent paystub once every two weeks to keep building RGE.
          </p>
          <input
            ref={paystubInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handlePaystubFile(e.target.files)}
          />
          <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2">
            <p className="text-xs text-neutral-500">
              {paystubEligible
                ? "Eligible now"
                : `Next eligible ${fmtDate(paystubNextEligibleAt)}`}
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={!paystubEligible || uploadingPaystub}
              onClick={() => paystubInputRef.current?.click()}
            >
              {uploadingPaystub ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Referrals ── */}
      <Card className="p-5">
        <CardContent className="flex flex-col gap-3 p-0">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-orange-500" />
            <h2 className="text-sm font-semibold text-navy-900">Refer a tenant</h2>
          </div>
          <p className="text-xs text-neutral-500">
            Enter another tenant&apos;s ID to refer them — {referralsRemaining} of {REFERRAL_QUARTERLY_CAP}{" "}
            referrals left this quarter.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Tenant ID"
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleReferralSubmit}
              disabled={referralSubmitting || !referralInput.trim() || referralsRemaining === 0}
            >
              {referralSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refer"}
            </Button>
          </div>
          {referralError && <p className="text-xs text-red-600">{referralError}</p>}

          {referrals.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              {referrals.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-navy-900">
                      {referredNames[r.referredTenantId] ?? r.referredTenantId}
                    </p>
                    <p className="truncate text-[10px] font-mono text-neutral-400">{r.referredTenantId}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
