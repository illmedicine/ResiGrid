"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { CheckCircle2, Clock, DollarSign, ExternalLink, Landmark, RefreshCw, Save, Wallet } from "lucide-react";
import { db, functions } from "@/lib/firebase/config";
import { externalPaymentClaimsCol, paymentsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useUserDisplayName } from "@/lib/hooks/useUserDisplayName";
import { EXTERNAL_METHODS, EXTERNAL_METHOD_KEYS } from "@/lib/payments/externalMethods";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type {
  ExternalPaymentClaimDoc,
  PaymentDoc,
  PaymentMethodsConfig,
  PropertyManagerDoc,
} from "@/lib/types/models";

interface ConnectionStatus {
  connected: boolean;
  connectedAt?: number;
}

export default function PmPayoutsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentDoc[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // Direct-pay handle configuration
  const [methods, setMethods] = useState<PaymentMethodsConfig>({});
  const [savingMethods, setSavingMethods] = useState(false);
  const [methodsSaved, setMethodsSaved] = useState(false);

  // Pending tenant-reported external payments awaiting confirmation
  const [claims, setClaims] = useState<ExternalPaymentClaimDoc[]>([]);
  const [claimBusy, setClaimBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "propertyManagers", user.uid)).then((snap) => {
      const profile = snap.data() as PropertyManagerDoc | undefined;
      if (profile?.paymentMethods) setMethods(profile.paymentMethods);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(externalPaymentClaimsCol(), where("pmId", "==", user.uid), where("status", "==", "pending"));
    return onSnapshot(
      q,
      (snap) => {
        setClaims(
          snap.docs
            .map((d) => ({ ...d.data(), id: d.id }) as ExternalPaymentClaimDoc)
            .sort((a, b) => b.createdAt - a.createdAt),
        );
      },
      () => {},
    );
  }, [user]);

  async function handleSaveMethods() {
    if (!user) return;
    setSavingMethods(true);
    try {
      const cleaned: PaymentMethodsConfig = {};
      for (const key of EXTERNAL_METHOD_KEYS) {
        const raw = methods[key]?.trim().replace(/^[@$]/, "");
        if (raw) cleaned[key] = raw;
      }
      await setDoc(
        doc(db, "propertyManagers", user.uid),
        { uid: user.uid, paymentMethods: cleaned },
        { merge: true },
      );
      setMethods(cleaned);
      setMethodsSaved(true);
      setTimeout(() => setMethodsSaved(false), 3000);
    } finally {
      setSavingMethods(false);
    }
  }

  async function handleResolveClaim(claimId: string, approve: boolean) {
    setClaimBusy(claimId);
    setError(null);
    try {
      const call = httpsCallable<{ claimId: string; approve: boolean }, { ok: boolean }>(
        functions,
        "confirmExternalPayment",
      );
      await call({ claimId, approve });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update the payment report.");
    } finally {
      setClaimBusy(null);
    }
  }

  useEffect(() => {
    const getStatus = httpsCallable<unknown, ConnectionStatus>(functions, "getSquareConnectionStatus");
    getStatus()
      .then((res) => setStatus(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load status"))
      .finally(() => setLoading(false));
  }, []);

  // Load payments received by this PM
  useEffect(() => {
    if (!user) return;
    const q = query(paymentsCol(), where("pmId", "==", user.uid));
    return onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ ...d.data(), id: d.id } as PaymentDoc))
          .sort((a, b) => (b.paidDate ?? 0) - (a.paidDate ?? 0));
        setPayments(docs);
        setPaymentsLoading(false);
      },
      () => setPaymentsLoading(false),
    );
  }, [user]);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const getConnectUrl = httpsCallable<{ claimToken?: string }, { url: string }>(
        functions,
        "getSquareConnectUrl",
      );
      const res = await getConnectUrl({});
      window.location.href = res.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start Square connection");
      setConnecting(false);
    }
  }

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Payment Center</h1>
        <p className="text-sm text-neutral-600">
          Rent payments from your ResiGrid tenants are deposited directly into your connected
          Square account. ResiGrid charges no fees — Square&apos;s standard processing rates apply.
        </p>
      </div>

      {/* Square connection */}
      <Card className="p-5">
        <CardContent className="flex flex-col gap-3 p-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Landmark className="h-4 w-4 text-orange-500" />
            Square account
          </h2>

          {loading ? (
            <p className="text-sm text-neutral-600">Checking connection…</p>
          ) : status?.connected ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Connected
                {status.connectedAt && (
                  <span className="text-xs font-normal text-neutral-500">
                    since {new Date(status.connectedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-600">
                Tenant payments go directly into your Square merchant account and are paid out on Square&apos;s normal schedule (typically 1–2 business days).
              </p>
              <Button size="sm" variant="outline" onClick={handleConnect} disabled={connecting} className="w-fit">
                <RefreshCw className="h-3.5 w-3.5" />
                {connecting ? "Redirecting…" : "Reconnect Square"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-neutral-600">
                Connect your Square account so rent payments from your tenants deposit directly
                into your bank. Your tenants pay right from their ResiGrid tenant portal — with
                $0 in transaction fees — and every on-time payment builds their RGE Score.
              </p>

              <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-navy-900">
                  Requires a Square merchant account — free, ~5 minutes if you don&apos;t have one
                </p>
                <ol className="flex flex-col gap-2.5">
                  <WizardStep n={1}>
                    <strong className="text-navy-900">Create your free Square account.</strong>{" "}
                    Sign up with your business (or personal landlord) details —{" "}
                    <a
                      href="https://squareup.com/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-semibold text-orange-600 hover:underline"
                    >
                      squareup.com/signup <ExternalLink className="h-3 w-3" />
                    </a>
                  </WizardStep>
                  <WizardStep n={2}>
                    <strong className="text-navy-900">Verify your identity &amp; link your bank</strong>{" "}
                    inside Square (they&apos;ll walk you through it). This is where your rent
                    deposits will land.
                  </WizardStep>
                  <WizardStep n={3}>
                    <strong className="text-navy-900">Come back here and click Connect Square</strong>{" "}
                    to authorize ResiGrid. Done — tenant payments start depositing automatically.
                  </WizardStep>
                </ol>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleConnect} disabled={connecting} className="w-fit">
                  {connecting ? "Redirecting…" : "Connect Square"}
                </Button>
                <span className="text-xs text-neutral-500">Already have Square? This is your only step.</span>
              </div>
              <p className="text-xs text-neutral-500">
                You&apos;ll be redirected to Square to authorize access. Your credentials are stored securely by Square — ResiGrid never sees your banking details.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {/* Pending external payment confirmations */}
      {claims.length > 0 && (
        <Card className="border-amber-300 p-5">
          <CardContent className="flex flex-col gap-3 p-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <Clock className="h-4 w-4 text-amber-500" />
              Payments awaiting your confirmation
            </h2>
            <p className="text-xs text-neutral-600">
              These tenants say they paid you directly through one of your enabled payment apps.
              Check that the money arrived, then confirm — confirming records the payment,
              files a receipt in the tenant&apos;s documents, and builds their RGE Score.
            </p>
            <div className="flex flex-col gap-2">
              {claims.map((claim) => (
                <ClaimRow
                  key={claim.id}
                  claim={claim}
                  busy={claimBusy === claim.id}
                  onResolve={handleResolveClaim}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Direct-pay handles */}
      <Card className="p-5">
        <CardContent className="flex flex-col gap-3 p-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Wallet className="h-4 w-4 text-orange-500" />
            More ways to get paid
          </h2>
          <p className="text-xs text-neutral-600">
            Prefer PayPal, Cash App, Venmo, Chime, or Zelle? Add your handles below and your
            tenants will see those options on their Pay Rent page. Payments go{" "}
            <strong className="text-navy-900">directly to you</strong> — the tenant reports the
            payment and you confirm it here so it still counts in ResiGrid (receipt + RGE Score).
            Leave a field blank to hide that option from tenants.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {EXTERNAL_METHOD_KEYS.map((key) => {
              const meta = EXTERNAL_METHODS[key];
              return (
                <div key={key}>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-navy-900">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    {meta.label}
                  </label>
                  <div className="flex items-center rounded-lg border border-neutral-200 focus-within:border-orange-400">
                    {meta.handlePrefix && (
                      <span className="pl-3 text-sm text-neutral-400">{meta.handlePrefix}</span>
                    )}
                    <input
                      type="text"
                      value={methods[key] ?? ""}
                      onChange={(e) => setMethods((m) => ({ ...m, [key]: e.target.value }))}
                      placeholder={meta.placeholder}
                      className="w-full rounded-lg px-2 py-2 text-sm text-navy-900 outline-none"
                    />
                  </div>
                  <p className="mt-0.5 text-[10px] text-neutral-400">{meta.configHint}</p>
                </div>
              );
            })}
          </div>
          <Button onClick={handleSaveMethods} disabled={savingMethods} size="sm" className="w-fit">
            <Save className="h-4 w-4" />
            {methodsSaved ? "Saved!" : savingMethods ? "Saving…" : "Save payment methods"}
          </Button>
        </CardContent>
      </Card>

      {/* Summary stats */}
      {payments.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            icon={DollarSign}
            label="Total received"
            value={`$${totalReceived.toLocaleString()}`}
          />
          <StatCard
            icon={CheckCircle2}
            label="Payments"
            value={String(payments.length)}
          />
          <StatCard
            icon={Clock}
            label="On-time rate"
            value={(() => {
              const withStatus = payments.filter((p) => p.onTime !== undefined);
              if (!withStatus.length) return "—";
              const pct = Math.round((withStatus.filter((p) => p.onTime).length / withStatus.length) * 100);
              return `${pct}%`;
            })()}
          />
        </div>
      )}

      {/* Payment history */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-navy-900">Payment history</h2>

        {paymentsLoading ? (
          <p className="text-sm text-neutral-600">Loading…</p>
        ) : payments.length === 0 ? (
          <Card className="p-5">
            <CardContent className="p-0">
              <p className="text-sm text-neutral-600">
                No payments received yet. Once a tenant pays you through ResiGrid, each transaction appears here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {payments.map((payment) => (
              <Card key={payment.id} className="p-4">
                <CardContent className="flex items-center justify-between gap-3 p-0">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">
                      ${payment.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {payment.paidDate
                        ? new Date(payment.paidDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                    <p className="text-xs text-neutral-400 font-mono">
                      {payment.tenantId.slice(0, 8)}…
                    </p>
                  </div>
                  <Badge
                    tone={
                      payment.onTime === true
                        ? "success"
                        : payment.onTime === false
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {payment.onTime === true
                      ? "On time"
                      : payment.onTime === false
                        ? "Late"
                        : "Received"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WizardStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
        {n}
      </span>
      <span className="text-xs leading-relaxed text-neutral-600">{children}</span>
    </li>
  );
}

function ClaimRow({
  claim,
  busy,
  onResolve,
}: {
  claim: ExternalPaymentClaimDoc;
  busy: boolean;
  onResolve: (claimId: string, approve: boolean) => void;
}) {
  const tenantName = useUserDisplayName(claim.tenantId);
  const meta = EXTERNAL_METHODS[claim.method];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-neutral-200 bg-white p-3">
      <span className="text-sm font-bold text-navy-900">${claim.amount.toLocaleString()}</span>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
        style={{ backgroundColor: meta?.color ?? "#666" }}
      >
        {meta?.label ?? claim.method}
      </span>
      <span className="text-xs text-neutral-600">from {tenantName ?? claim.tenantId.slice(0, 8)}</span>
      <span className="text-xs text-neutral-400">
        {new Date(claim.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </span>
      {claim.note && <span className="text-xs italic text-neutral-500">&ldquo;{claim.note}&rdquo;</span>}
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onResolve(claim.id, true)}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {busy ? "…" : "Money received ✓"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onResolve(claim.id, false)}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
        >
          Not received
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-1 p-0">
        <Icon className="h-4 w-4 text-orange-500" />
        <p className="text-lg font-bold text-navy-900">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
      </CardContent>
    </Card>
  );
}
