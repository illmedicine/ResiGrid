"use client";

// Printable rent receipt — linked from the auto-filed receipt document in
// the tenant's Documents space. Firestore rules only allow the payment's
// tenant or PM (or their team) to read the underlying payment doc, so this
// page shows nothing to anyone else.

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { CheckCircle2, Loader2, Printer } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { Logo } from "@/components/ui/Logo";
import type { PaymentDoc, PropertyManagerDoc, UserDoc } from "@/lib/types/models";

function ReceiptContent() {
  const params = useSearchParams();
  const paymentId = params.get("id");
  const { user, loading: authLoading } = useAuth();

  const [payment, setPayment] = useState<PaymentDoc | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [tenantName, setTenantName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("Sign in to view this receipt.");
      setLoading(false);
      return;
    }
    if (!paymentId) {
      setError("No receipt specified.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const paySnap = await getDoc(doc(db, "payments", paymentId));
        if (!paySnap.exists()) throw new Error("Receipt not found.");
        const pay = { ...paySnap.data(), id: paySnap.id } as PaymentDoc;

        const [pmProfileSnap, pmUserSnap, tenantSnap] = await Promise.all([
          pay.pmId ? getDoc(doc(db, "propertyManagers", pay.pmId)) : Promise.resolve(null),
          pay.pmId ? getDoc(doc(db, "users", pay.pmId)) : Promise.resolve(null),
          getDoc(doc(db, "users", pay.tenantId)),
        ]);
        if (cancelled) return;

        const business =
          (pmProfileSnap?.data() as PropertyManagerDoc | undefined)?.businessName?.trim() ||
          (pmUserSnap?.data() as UserDoc | undefined)?.displayName ||
          "Property Manager";
        setPayment(pay);
        setBusinessName(business);
        setTenantName((tenantSnap.data() as UserDoc | undefined)?.displayName ?? pay.tenantId);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unable to load this receipt.");
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, user, paymentId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }
  if (error || !payment) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-neutral-600">{error ?? "Unable to load this receipt."}</p>
      </div>
    );
  }

  const paidDate = payment.paidDate
    ? new Date(payment.paidDate).toLocaleDateString(undefined, {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex justify-end print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-navy-900 hover:bg-neutral-50"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save PDF
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm print:border-0 print:shadow-none">
          {/* Header */}
          <div className="flex flex-col items-center gap-2 border-b border-dashed border-neutral-200 bg-navy-900 px-6 py-6 text-center">
            <Logo size={90} />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-400">
              Official Rent Receipt
            </p>
          </div>

          <div className="flex flex-col gap-5 px-6 py-6">
            {/* Amount */}
            <div className="flex flex-col items-center gap-1 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <p className="text-3xl font-bold text-navy-900">
                ${payment.amount.toLocaleString()}
              </p>
              <p className="text-xs font-medium text-green-700">
                Payment {payment.status === "completed" ? "completed" : payment.status}
                {payment.onTime != null && (payment.onTime ? " · on time" : " · late")}
              </p>
            </div>

            {/* Details */}
            <div className="flex flex-col divide-y divide-neutral-100 text-sm">
              <Row label="Paid to" value={businessName} strong />
              <Row label="Paid by" value={tenantName} />
              <Row label="Date" value={paidDate} />
              <Row label="Method" value={payment.method === "voucher" ? "Card via ResiGrid" : "Card"} />
              <Row label="Reference" value={payment.id} mono />
            </div>

            <p className="text-center text-[10px] leading-relaxed text-neutral-400">
              Processed by Square through ResiGrid — The Residential Grid Economy.
              Tenants pay $0 in transaction fees. This receipt was generated
              automatically and filed to the tenant&apos;s ResiGrid documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong, mono }: { label: string; value: string; strong?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs uppercase tracking-wide text-neutral-400">{label}</span>
      <span
        className={`text-right ${strong ? "font-bold text-navy-900" : "text-navy-900"} ${mono ? "font-mono text-xs break-all" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense>
      <ReceiptContent />
    </Suspense>
  );
}
