"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { functions } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { useActiveLease } from "@/lib/hooks/useActiveLease";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import type { SquareCard } from "@/lib/square/client";
import { SquareCardField } from "./SquareCardField";

const schema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than 0"),
  recipientContact: z
    .string()
    .min(1, "Enter the recipient's email or phone number"),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface CreateVoucherResponse {
  voucherId: string;
  status: string;
  claimUrl?: string;
}

export function PayRentForm() {
  const { user } = useAuth();
  const { lease } = useActiveLease(user?.uid);
  const [card, setCard] = useState<SquareCard | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateVoucherResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: lease ? { amount: lease.rentAmount } : undefined,
  });

  async function onSubmit(values: FormValues) {
    if (!card) {
      setError("Card form is still loading — try again in a moment.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const tokenResult = await card.tokenize();
      if (tokenResult.status !== "OK" || !tokenResult.token) {
        throw new Error(
          tokenResult.errors?.[0]?.message ?? "Card was declined",
        );
      }

      const createVoucher = httpsCallable<
        {
          amount: number;
          recipientContact: string;
          sourceId: string;
          leaseId?: string;
        },
        CreateVoucherResponse
      >(functions, "createVoucher");

      const res = await createVoucher({
        amount: values.amount,
        recipientContact: values.recipientContact,
        sourceId: tokenResult.token,
        leaseId: lease?.id,
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
      <Card className="p-5">
        <CardContent className="flex flex-col gap-2 p-0">
          <h2 className="text-base font-semibold text-navy-900">
            Payment submitted
          </h2>
          <p className="text-sm text-neutral-600">
            Your payment voucher (<code>{result.voucherId}</code>) is{" "}
            {result.status}. If your landlord isn&apos;t on ResiGrid yet,
            we&apos;ve sent them a claim link to deposit the funds.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Amount (USD)"
        type="number"
        step="0.01"
        min="1"
        {...register("amount")}
        error={errors.amount?.message}
      />
      <Input
        label="Recipient email or phone"
        placeholder="landlord@example.com"
        {...register("recipientContact")}
        error={errors.recipientContact?.message}
      />
      {lease && (
        <p className="text-xs text-neutral-600">
          Paying toward your active lease — recipient defaults to your
          property manager on file.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-navy-900">
          Card details
        </label>
        <SquareCardField onReady={setCard} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting || !card}>
        {submitting ? "Processing…" : "Pay now"}
      </Button>

      <p className="text-xs text-neutral-600">
        Payments are processed by Square. Recipients who aren&apos;t on
        ResiGrid claim funds via a secure link and a bank transfer — no
        ResiGrid account required.
      </p>
    </form>
  );
}
