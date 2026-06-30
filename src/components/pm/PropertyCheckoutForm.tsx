"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { httpsCallable } from "firebase/functions";
import { Building2, CheckCircle2 } from "lucide-react";
import { functions } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SquareCardField } from "@/components/tenant/SquareCardField";
import { calculatePropertyFee, feeBreakdown } from "@/lib/pricing/fees";
import type { SquareCard } from "@/lib/square/client";

const schema = z.object({
  propertyName: z.string().min(1, "Property name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(5, "ZIP code is required"),
  unitCount: z.coerce.number().min(1).max(50),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface CreatePMSubscriptionResponse {
  propertyId: string;
  amountCharged: number;
}

export function PropertyCheckoutForm() {
  const router = useRouter();
  const [card, setCard] = useState<SquareCard | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { unitCount: "1" as unknown as number },
  });

  const unitCount = Number(watch("unitCount")) || 1;
  const fee = calculatePropertyFee(unitCount);
  const breakdown = feeBreakdown(unitCount);

  async function onSubmit(values: FormValues) {
    if (!card) {
      setError("Card field is still loading — try again in a moment.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const tokenResult = await card.tokenize();
      if (tokenResult.status !== "OK" || !tokenResult.token) {
        throw new Error(tokenResult.errors?.[0]?.message ?? "Card was declined.");
      }

      const activate = httpsCallable<
        {
          sourceId: string;
          propertyName: string;
          addressLine1: string;
          city: string;
          state: string;
          zip: string;
          unitCount: number;
        },
        CreatePMSubscriptionResponse
      >(functions, "createPMSubscription");

      await activate({
        sourceId: tokenResult.token,
        propertyName: values.propertyName,
        addressLine1: values.addressLine1,
        city: values.city,
        state: values.state,
        zip: values.zip,
        unitCount: values.unitCount,
      });

      router.push("/pm/properties");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Property details */}
      <div className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-navy-900">
          <Building2 className="h-5 w-5 text-orange-500" />
          Property details
        </h2>
        <Input
          label="Property name"
          placeholder="e.g. Maple Street Apartments"
          {...register("propertyName")}
          error={errors.propertyName?.message}
        />
        <Input
          label="Street address"
          {...register("addressLine1")}
          error={errors.addressLine1?.message}
        />
        <div className="grid grid-cols-3 gap-3">
          <Input label="City" {...register("city")} error={errors.city?.message} />
          <Input label="State" {...register("state")} error={errors.state?.message} />
          <Input label="ZIP" {...register("zip")} error={errors.zip?.message} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">
            Number of units
          </label>
          <input
            type="number"
            min={1}
            max={50}
            {...register("unitCount")}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {errors.unitCount && (
            <p className="mt-1 text-xs text-red-600">{errors.unitCount.message}</p>
          )}
        </div>
      </div>

      {/* Live pricing */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
        <p className="text-xs text-neutral-600">{breakdown}</p>
        <p className="mt-1 text-2xl font-bold text-navy-900">
          ${fee.toLocaleString()}
          <span className="ml-1 text-sm font-normal text-neutral-600">
            one-time activation fee
          </span>
        </p>
        <ul className="mt-3 space-y-1 text-xs text-neutral-600">
          <CheckItem text="Unlimited lease management" />
          <CheckItem text="Tenant applications & screening" />
          <CheckItem text="Maintenance request inbox" />
          <CheckItem text="Secure messaging" />
          <CheckItem text="Rent payment collection" />
        </ul>
      </div>

      {/* Card field */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-900">
          Card details
        </label>
        <SquareCardField onReady={setCard} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="submit"
        disabled={submitting || !card}
        size="lg"
        className="w-full"
      >
        {submitting ? "Activating…" : `Pay $${fee} & Activate`}
      </Button>

      <p className="text-center text-xs text-neutral-500">
        One-time fee. No monthly charges. Payments processed by Square.
      </p>
    </form>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-orange-500" />
      {text}
    </li>
  );
}
