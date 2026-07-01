"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WatermarkLogo } from "@/components/ui/WatermarkLogo";
import { PropertyCheckoutForm } from "@/components/pm/PropertyCheckoutForm";
import { TRIAL_DAYS } from "@/lib/hooks/usePMSubscription";

const REASONS = {
  trial_expired: {
    eyebrow: "Free trial ended",
    heading: "Your 3-day trial has ended",
    sub: "Activate your first property to restore full access. One-time fee — no monthly charges.",
    urgentBanner: true,
  },
  trial: {
    eyebrow: "Activate before your trial ends",
    heading: "Lock in your access",
    sub: "Pay once. No subscriptions. Keep all PM features forever.",
    urgentBanner: false,
  },
  default: {
    eyebrow: `Property Manager Activation · ${TRIAL_DAYS}-day free trial included`,
    heading: "Activate your property on ResiGrid",
    sub: "One-time fee · No subscriptions · Add more properties anytime",
    urgentBanner: false,
  },
} as const;

function CheckoutContent() {
  const params = useSearchParams();
  const reasonKey = (params.get("reason") ?? "default") as keyof typeof REASONS;
  const copy = REASONS[reasonKey] ?? REASONS.default;

  return (
    <div
      className="relative flex flex-1 items-start justify-center px-4 py-10"
      style={{
        backgroundImage: `linear-gradient(rgba(11,31,58,0.88), rgba(11,31,58,0.88)),
          url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "calc(100dvh - 72px)",
      }}
    >
      <WatermarkLogo size={520} opacity={0.06} />

      <div className="relative z-10 w-full max-w-lg">
        {copy.urgentBanner && (
          <div className="mb-4 rounded-xl border border-red-400/40 bg-red-600/30 px-4 py-3 text-sm text-white backdrop-blur-sm">
            🔒 Portal access paused — activate to resume full access immediately.
          </div>
        )}

        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">
            {copy.eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-orange-400 md:text-3xl">
            {copy.heading}
          </h1>
          <p className="mt-2 text-sm text-white/70">{copy.sub}</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
          <PropertyCheckoutForm />
        </div>
      </div>
    </div>
  );
}

export default function PMCheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
