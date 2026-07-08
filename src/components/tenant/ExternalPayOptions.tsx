"use client";

// "Other ways to pay" — shows exactly the direct-pay apps this tenant's PM
// has enabled in their Payment Center (PayPal, Cash App, Venmo, Chime,
// Zelle). The tenant pays the PM directly in that app, then reports it here;
// the PM confirms receipt, which records the payment, files a receipt into
// the tenant's documents, and builds their RGE Score.

import { useEffect, useMemo, useState } from "react";
import { addDoc, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { CheckCircle2, ExternalLink, Send, XCircle } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { externalPaymentClaimsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { EXTERNAL_METHODS, EXTERNAL_METHOD_KEYS } from "@/lib/payments/externalMethods";
import { Button } from "@/components/ui/Button";
import type {
  ExternalPayMethod,
  ExternalPaymentClaimDoc,
  PaymentMethodsConfig,
  PropertyManagerDoc,
} from "@/lib/types/models";

interface ExternalPayOptionsProps {
  pmId: string;
  leaseTermsId?: string;
  invoiceId?: string;
  defaultAmount: number;
}

export function ExternalPayOptions({ pmId, leaseTermsId, invoiceId, defaultAmount }: ExternalPayOptionsProps) {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethodsConfig | null>(null);
  const [reporting, setReporting] = useState<ExternalPayMethod | null>(null);
  const [amount, setAmount] = useState(String(defaultAmount || ""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claims, setClaims] = useState<ExternalPaymentClaimDoc[]>([]);

  useEffect(() => {
    if (!pmId) return;
    getDoc(doc(db, "propertyManagers", pmId)).then(
      (snap) => setMethods((snap.data() as PropertyManagerDoc | undefined)?.paymentMethods ?? {}),
      () => setMethods({}),
    );
  }, [pmId]);

  // The tenant's own recent reports to this PM (pending/confirmed/declined).
  useEffect(() => {
    if (!user || !pmId) return;
    const q = query(
      externalPaymentClaimsCol(),
      where("tenantId", "==", user.uid),
      where("pmId", "==", pmId),
    );
    return onSnapshot(
      q,
      (snap) => {
        setClaims(
          snap.docs
            .map((d) => ({ ...d.data(), id: d.id }) as ExternalPaymentClaimDoc)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5),
        );
      },
      () => {},
    );
  }, [user, pmId]);

  const enabled = useMemo(
    () => EXTERNAL_METHOD_KEYS.filter((key) => Boolean(methods?.[key])),
    [methods],
  );

  useEffect(() => {
    setAmount(String(defaultAmount || ""));
  }, [defaultAmount]);

  if (!methods || enabled.length === 0) return null;

  async function handleReport(method: ExternalPayMethod) {
    if (!user) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError("Enter the amount you sent.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addDoc(externalPaymentClaimsCol(), {
        id: "",
        tenantId: user.uid,
        pmId,
        amount: amt,
        method,
        status: "pending",
        createdAt: Date.now(),
        ...(leaseTermsId ? { leaseTermsId } : {}),
        ...(invoiceId ? { invoiceId } : {}),
      });
      setReporting(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to report the payment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 pt-5">
      <div>
        <h3 className="text-sm font-semibold text-navy-900">Other ways to pay</h3>
        <p className="text-xs text-neutral-500">
          Your property manager also accepts these apps. Pay them directly, then tap
          &ldquo;I sent it&rdquo; so the payment is recorded and builds your RGE Score once
          they confirm.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {enabled.map((key) => {
          const meta = EXTERNAL_METHODS[key];
          const handle = methods[key]!;
          const link = meta.payUrl?.(handle, Number(amount) || undefined);
          const isReporting = reporting === key;
          return (
            <div key={key} className="rounded-xl border border-neutral-200 p-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                  style={{ backgroundColor: meta.color }}
                >
                  {meta.label}
                </span>
                <span className="font-mono text-sm text-navy-900">
                  {meta.handlePrefix}
                  {handle}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800"
                    >
                      Open {meta.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-500">{meta.tenantInstructions?.(handle)}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setReporting(isReporting ? null : key)}
                    className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50"
                  >
                    I sent it
                  </button>
                </div>
              </div>

              {isReporting && (
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                      Amount sent (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-32 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-navy-900 outline-none focus:border-orange-400"
                    />
                  </div>
                  <Button size="sm" disabled={submitting} onClick={() => handleReport(key)}>
                    <Send className="h-3.5 w-3.5" />
                    {submitting ? "Reporting…" : "Report payment"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {claims.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Your reported payments
          </p>
          {claims.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-xs">
              {c.status === "confirmed" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              ) : c.status === "declined" ? (
                <XCircle className="h-3.5 w-3.5 text-red-500" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-amber-400" />
              )}
              <span className="font-semibold text-navy-900">${c.amount.toLocaleString()}</span>
              <span className="text-neutral-500">via {EXTERNAL_METHODS[c.method]?.label ?? c.method}</span>
              <span className={
                c.status === "confirmed" ? "text-green-600" : c.status === "declined" ? "text-red-500" : "text-amber-600"
              }>
                {c.status === "pending" ? "awaiting confirmation" : c.status}
              </span>
              <span className="ml-auto text-neutral-400">
                {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
