"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Lock, Zap, Award, DollarSign } from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { usePMSubscription } from "@/lib/hooks/usePMSubscription";
import { WatermarkLogo } from "@/components/ui/WatermarkLogo";
import { PM_TIERS } from "@/lib/pricing/fees";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const { sub, isActive, tierConfig } = usePMSubscription(user?.uid);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Give PayPal webhook time to process payment (2-3 seconds)
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="mb-4 text-lg font-semibold text-navy-900">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div
        className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,58,0.88), rgba(11,31,58,0.88)),
            url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <WatermarkLogo size={500} opacity={0.06} />
        <div className="relative z-10 w-full max-w-lg text-center">
          <div className="mb-6 inline-block animate-spin">
            <Zap className="h-8 w-8 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-orange-400 md:text-3xl">
            Processing Payment
          </h1>
          <p className="mt-4 text-white/70">
            Your subscription is being activated. Please wait...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10"
      style={{
        backgroundImage: `linear-gradient(rgba(11,31,58,0.88), rgba(11,31,58,0.88)),
          url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <WatermarkLogo size={500} opacity={0.06} />

      <div className="relative z-10 w-full max-w-2xl">
        {isActive && tierConfig ? (
          <>
            {/* ── Success message ── */}
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-green-100 p-4 text-green-600">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                Payment Successful!
              </h1>
              <p className="mt-3 text-white/80">
                Welcome to <span className="font-semibold text-orange-400">{tierConfig.name}</span>. Your portal is now fully activated.
              </p>
            </div>

            {/* ── Package Status ── */}
            <div className="mb-8 rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/20 to-orange-600/10 p-8 backdrop-blur-sm">
              <h2 className="mb-6 text-center text-2xl font-bold text-white">
                ✨ Unlocked Privileges
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <PrivilegeCard
                  icon={Lock}
                  title="Full Portal Access"
                  description="Complete property management suite with all features included"
                />
                <PrivilegeCard
                  icon={DollarSign}
                  title="Fair Pricing"
                  description={`${tierConfig.capacityLabel} · $${tierConfig.annualFee}/year + $1/month per occupied unit`}
                />
                <PrivilegeCard
                  icon={Zap}
                  title="Zero Tenant Fees"
                  description="Collect rent fee-free. Tenants pay $0 in transaction charges—always"
                />
                <PrivilegeCard
                  icon={Award}
                  title="RGE Network Access"
                  description="Post listings and access verified, RGE-scored tenants"
                />
              </div>
            </div>

            {/* ── Subscription Details ── */}
            <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="mb-4 font-bold text-navy-900">Your Package Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Plan</span>
                  <span className="font-semibold text-navy-900">{tierConfig.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Annual Fee</span>
                  <span className="font-semibold text-navy-900">${tierConfig.annualFee}/year</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Capacity</span>
                  <span className="font-semibold text-navy-900">{tierConfig.capacityLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Per-Unit Cost</span>
                  <span className="font-semibold text-green-600">
                    ${tierConfig.monthlyUnitFee}/month (occupied units only)
                  </span>
                </div>
                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-navy-900">Status</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                      <span className="h-2 w-2 rounded-full bg-green-600" />
                      Active & Unlocked
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Next Steps ── */}
            <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
              <h3 className="mb-3 font-bold text-blue-900">Next Steps</h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="shrink-0 font-bold">1.</span>
                  <span>Add your first property and upload photos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 font-bold">2.</span>
                  <span>Create and publish listings to attract tenants</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 font-bold">3.</span>
                  <span>Screen applications and start managing leases</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 font-bold">4.</span>
                  <span>Collect rent fee-free and monitor your properties</span>
                </li>
              </ol>
            </div>

            {/* ── CTA ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/pm/dashboard"
                className="flex-1 rounded-lg bg-orange-500 px-6 py-3 text-center font-bold text-white hover:bg-orange-600 transition"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/pm/properties"
                className="flex-1 rounded-lg border border-white px-6 py-3 text-center font-bold text-white hover:bg-white/10 transition"
              >
                Add Your First Property
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* ── Pending verification ── */}
            <div className="text-center">
              <div className="mb-4 inline-block">
                <Zap className="h-12 w-12 text-orange-400" />
              </div>
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                Payment Processing
              </h1>
              <p className="mt-4 text-white/70">
                Your subscription is being verified. If you were not redirected automatically, click below to continue.
              </p>
              <Link
                href="/pm/dashboard"
                className="mt-6 inline-block rounded-lg bg-orange-500 px-7 py-3 font-bold text-white hover:bg-orange-600 transition"
              >
                Continue to Dashboard →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PrivilegeCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Lock;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-orange-500/20 p-2 text-orange-400">
          <Icon className="h-5 w-5" />
        </span>
        <h4 className="font-bold text-white">{title}</h4>
      </div>
      <p className="text-sm text-white/70">{description}</p>
    </div>
  );
}
