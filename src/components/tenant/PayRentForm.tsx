"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Home, User } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { functions } from "@/lib/firebase/config";
import { leaseTermsCol, unitsCol, usersCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import type { LeaseTermsDoc, PropertyDoc, UnitDoc, UserDoc } from "@/lib/types/models";
import type { SquareCard } from "@/lib/square/client";
import { SquareCardField } from "./SquareCardField";

const leaseSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than 0"),
});

const anyoneSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than 0"),
  recipientContact: z.string().min(1, "Enter the recipient's email or phone number"),
});

interface CreateVoucherResponse {
  voucherId: string;
  status: string;
  claimUrl?: string;
}

export function PayRentForm() {
  const { user } = useAuth();

  // Lease + context data
  const [signedLease, setSignedLease] = useState<LeaseTermsDoc | null>(null);
  const [pmUser, setPmUser] = useState<UserDoc | null>(null);
  const [myUnit, setMyUnit] = useState<UnitDoc | null>(null);
  const [myProperty, setMyProperty] = useState<PropertyDoc | null>(null);
  const [leaseLoading, setLeaseLoading] = useState(true);

  // Payment state
  const [card, setCard] = useState<SquareCard | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateVoucherResponse | null>(null);

  // Load signed lease from leaseTerms collection
  useEffect(() => {
    if (!user) return;
    const q = query(leaseTermsCol(), where("tenantId", "==", user.uid), where("status", "==", "fully_signed"));
    return onSnapshot(q, (snap) => {
      const lease = snap.empty ? null : ({ ...snap.docs[0].data(), id: snap.docs[0].id } as LeaseTermsDoc);
      setSignedLease(lease);
      setLeaseLoading(false);
    });
  }, [user]);

  // Load PM user
  useEffect(() => {
    if (!signedLease?.pmId) { setPmUser(null); return; }
    return onSnapshot(doc(db, "users", signedLease.pmId), (snap) => {
      setPmUser(snap.exists() ? ({ ...snap.data(), uid: snap.id } as UserDoc) : null);
    });
  }, [signedLease?.pmId]);

  // Load unit
  useEffect(() => {
    if (!signedLease?.unitId) { setMyUnit(null); return; }
    return onSnapshot(doc(db, "units", signedLease.unitId), (snap) => {
      setMyUnit(snap.exists() ? ({ ...snap.data(), id: snap.id } as UnitDoc) : null);
    });
  }, [signedLease?.unitId]);

  // Load property
  useEffect(() => {
    if (!signedLease?.propertyId) { setMyProperty(null); return; }
    return onSnapshot(doc(db, "properties", signedLease.propertyId), (snap) => {
      setMyProperty(snap.exists() ? ({ ...snap.data(), id: snap.id } as PropertyDoc) : null);
    });
  }, [signedLease?.propertyId]);

  const hasLease = Boolean(signedLease);

  const leaseForm = useForm<{ amount: number }>({
    resolver: zodResolver(leaseSchema),
    values: signedLease ? { amount: signedLease.rent } : undefined,
  });

  const anyoneForm = useForm<{ amount: number; recipientContact: string }>({
    resolver: zodResolver(anyoneSchema),
  });

  async function handleLeasePayment(values: { amount: number }) {
    if (!card || !signedLease) return;
    setError(null);
    setSubmitting(true);
    try {
      const tokenResult = await card.tokenize();
      if (tokenResult.status !== "OK" || !tokenResult.token) {
        throw new Error(tokenResult.errors?.[0]?.message ?? "Card was declined");
      }
      const createVoucher = httpsCallable<object, CreateVoucherResponse>(functions, "createVoucher");
      const res = await createVoucher({
        amount: values.amount,
        pmId: signedLease.pmId,
        sourceId: tokenResult.token,
        leaseTermsId: signedLease.id,
      });
      setResult(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAnyonePayment(values: { amount: number; recipientContact: string }) {
    if (!card) return;
    setError(null);
    setSubmitting(true);
    try {
      const tokenResult = await card.tokenize();
      if (tokenResult.status !== "OK" || !tokenResult.token) {
        throw new Error(tokenResult.errors?.[0]?.message ?? "Card was declined");
      }
      const createVoucher = httpsCallable<object, CreateVoucherResponse>(functions, "createVoucher");
      const res = await createVoucher({
        amount: values.amount,
        recipientContact: values.recipientContact,
        sourceId: tokenResult.token,
      });
      setResult(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
        <h2 className="text-base font-semibold text-navy-900">Payment submitted</h2>
        <p className="text-sm text-neutral-600 max-w-sm">
          {result.status === "paid_out"
            ? "Your payment was delivered directly to your property manager's Square account."
            : "Your property manager will receive an email to claim this payment. If they aren't on ResiGrid yet, they'll follow the link to deposit the funds."}
        </p>
        <p className="text-xs text-neutral-400 font-mono">Ref: {result.voucherId}</p>
        <Button size="sm" variant="outline" onClick={() => setResult(null)}>
          Make another payment
        </Button>
      </div>
    );
  }

  if (leaseLoading) {
    return <p className="text-sm text-neutral-600">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Signed lease — direct rent payment */}
      {hasLease && signedLease && (
        <>
          {/* Context card */}
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <Home className="h-4 w-4 text-orange-500" />
              Paying rent
            </div>
            {myProperty && (
              <p className="text-xs text-neutral-600">
                {myProperty.name}
                {myUnit ? ` · Unit ${myUnit.unitNumber}` : ""}
                {" · "}
                {myProperty.addressLine1}, {myProperty.city}, {myProperty.state}
              </p>
            )}
            {pmUser && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                <User className="h-3.5 w-3.5" />
                Paid to: <span className="font-medium text-navy-900">{pmUser.displayName}</span>
              </div>
            )}
            <p className="text-xs text-neutral-500">
              Lease rent: <span className="font-semibold text-navy-900">${signedLease.rent.toLocaleString()}/mo</span>
              {" · "}Late fee after {signedLease.lateFeeDays} days
            </p>
          </div>

          <form onSubmit={leaseForm.handleSubmit(handleLeasePayment)} className="flex flex-col gap-4">
            <Input
              label="Amount (USD)"
              type="number"
              step="0.01"
              min="1"
              {...leaseForm.register("amount")}
              error={leaseForm.formState.errors.amount?.message}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-navy-900">Card details</label>
              <SquareCardField onReady={setCard} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={submitting || !card}>
              {submitting ? "Processing…" : `Pay $${leaseForm.watch("amount") || signedLease.rent}`}
            </Button>
            <p className="text-xs text-neutral-500">
              Processed by Square — funds go directly to your property manager. ResiGrid charges no fees.
            </p>
          </form>
        </>
      )}

      {/* No lease — pay anyone form */}
      {!hasLease && (
        <>
          <p className="text-sm text-neutral-600">
            No active signed lease found. You can still pay any landlord directly using their email or phone.
          </p>
          <form onSubmit={anyoneForm.handleSubmit(handleAnyonePayment)} className="flex flex-col gap-4">
            <Input
              label="Amount (USD)"
              type="number"
              step="0.01"
              min="1"
              {...anyoneForm.register("amount")}
              error={anyoneForm.formState.errors.amount?.message}
            />
            <Input
              label="Recipient email or phone"
              placeholder="landlord@example.com"
              {...anyoneForm.register("recipientContact")}
              error={anyoneForm.formState.errors.recipientContact?.message}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-navy-900">Card details</label>
              <SquareCardField onReady={setCard} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={submitting || !card}>
              {submitting ? "Processing…" : "Pay now"}
            </Button>
            <p className="text-xs text-neutral-500">
              Recipients who aren't on ResiGrid claim funds via a secure email link. Processed by Square — no ResiGrid fees.
            </p>
          </form>
        </>
      )}
    </div>
  );
}
