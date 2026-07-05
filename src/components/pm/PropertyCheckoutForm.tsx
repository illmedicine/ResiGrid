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
import { PM_TIERS, TIER_ORDER, type PMTier } from "@/lib/pricing/fees";
import type { SquareCard } from "@/lib/square/client";

const schema = z.object({
  propertyName: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  termsAgreed: z.literal(true, {
    message: "You must agree to the billing terms to continue.",
  }),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface CreatePMSubscriptionResponse {
  propertyId?: string;
  amountCharged: number;
}

export function PropertyCheckoutForm() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<PMTier>("starter");
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
  });

  const termsAgreed = watch("termsAgreed");

  const tier = PM_TIERS[selectedTier];

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
          tier: PMTier;
          propertyName?: string;
          addressLine1?: string;
          city?: string;
          state?: string;
          zip?: string;
          unitCount?: number;
        },
        CreatePMSubscriptionResponse
      >(functions, "createPMSubscription");

      await activate({
        sourceId: tokenResult.token,
        tier: selectedTier,
        ...(values.propertyName?.trim() ? {
          propertyName: values.propertyName.trim(),
          addressLine1: values.addressLine1?.trim(),
          city: values.city?.trim(),
          state: values.state?.trim(),
          zip: values.zip?.trim(),
          unitCount: 1,
        } : {}),
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

      {/* ── Tier selector ── */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-navy-900">Choose your plan</p>
        <div className="flex flex-col gap-2">
          {TIER_ORDER.map((tierId) => {
            const t = PM_TIERS[tierId];
            const active = selectedTier === tierId;
            return (
              <button
                key={tierId}
                type="button"
                onClick={() => setSelectedTier(tierId)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-orange-400 bg-orange-50 ring-1 ring-orange-400"
                    : "border-neutral-200 bg-white hover:border-orange-200"
                }`}
              >
                <div>
                  <p className={`text-sm font-semibold ${active ? "text-navy-900" : "text-neutral-700"}`}>
                    {t.name}
                  </p>
                  <p className="text-xs text-neutral-500">{t.capacityLabel}</p>
                </div>
                <div className="text-right">
                  <p className={`text-base font-bold ${active ? "text-orange-600" : "text-neutral-700"}`}>
                    ${t.annualFee}/yr
                  </p>
                  <p className="text-xs text-neutral-400">+ $1/mo/occupied unit</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Property details ── */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-navy-900">
            <Building2 className="h-5 w-5 text-orange-500" />
            First property
            <span className="ml-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-normal text-neutral-500">
              optional
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Already added your property during the trial? Leave this blank — your properties are saved.
          </p>
        </div>
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
      </div>

      {/* ── Pricing summary ── */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
        <p className="text-xs text-neutral-600">
          {tier.capacityLabel} · Annual subscription — due today
        </p>
        <p className="mt-1 text-2xl font-bold text-navy-900">
          ${tier.annualFee}
          <span className="ml-1 text-sm font-normal text-neutral-600">
            / year — charged now
          </span>
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">
          Then $1/month per occupied unit, billed monthly every 30 days
        </p>
        <ul className="mt-3 space-y-1 text-xs text-neutral-600">
          <CheckItem text="All features included — nothing gated" />
          <CheckItem text="$0 tenant transaction fee — always" />
          <CheckItem text="Vacant units never billed" />
          <CheckItem text="Annual plan auto-renews — cancel anytime" />
        </ul>
      </div>

      {/* ── Card field ── */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-900">
          Card details
        </label>
        <SquareCardField onReady={setCard} />
      </div>

      {/* ── Terms agreement ── */}
      <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <input
          id="termsAgreed"
          type="checkbox"
          {...register("termsAgreed")}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-neutral-300 accent-orange-500"
        />
        <label htmlFor="termsAgreed" className="cursor-pointer text-xs leading-relaxed text-neutral-600">
          I agree to the{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-navy-900">
            ResiGrid Grid Contract
          </a>
          . I authorize ResiGrid to charge{" "}
          <strong className="text-navy-900">${tier.annualFee} today</strong> and{" "}
          <strong className="text-navy-900">$1/month per occupied unit</strong> every 30 days
          from activation. My annual subscription renews automatically each year. I understand
          I can cancel at any time from my account settings.
        </label>
      </div>
      {errors.termsAgreed && (
        <p className="text-xs text-red-600">{errors.termsAgreed.message as string}</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="submit"
        disabled={submitting || !card || !termsAgreed}
        size="lg"
        className="w-full"
      >
        {submitting ? "Activating…" : `Pay $${tier.annualFee} & Activate`}
      </Button>

      <p className="text-center text-xs text-neutral-500">
        Recurring annual subscription · Monthly per-unit billing after activation.
        Payments processed securely by Square.
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
