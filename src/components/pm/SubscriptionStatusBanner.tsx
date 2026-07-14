import Link from "next/link";
import { CheckCircle2, AlertCircle, Zap, Clock } from "lucide-react";
import { usePMSubscription, calcTrialStatus } from "@/lib/hooks/usePMSubscription";
import type { PMSubscriptionDoc } from "@/lib/types/models";

interface SubscriptionStatusBannerProps {
  uid: string | undefined;
}

export function SubscriptionStatusBanner({ uid }: SubscriptionStatusBannerProps) {
  const { sub, isActive, tierConfig } = usePMSubscription(uid);

  if (!sub) return null;

  const trialStatus = calcTrialStatus(sub.createdAt);

  if (isActive && tierConfig) {
    return (
      <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-50/50 p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-green-900">
              ✨ Premium Access Unlocked
            </h3>
            <p className="mt-1 text-sm text-green-800">
              Your <strong>{tierConfig.name}</strong> package is active. You have full access to all features including property management, listings, lease management, and the RGE network.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-green-700">
              <span className="rounded-full bg-green-200 px-3 py-1">
                ✓ {tierConfig.capacityLabel}
              </span>
              <span className="rounded-full bg-green-200 px-3 py-1">
                ✓ Zero tenant fees
              </span>
              <span className="rounded-full bg-green-200 px-3 py-1">
                ✓ All features included
              </span>
            </div>
          </div>
          <Link
            href="/pm/settings"
            className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 transition"
          >
            Manage Subscription
          </Link>
        </div>
      </div>
    );
  }

  if (trialStatus.inTrial) {
    return (
      <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-50/50 p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900">
              ⏱️ Free Trial Active
            </h3>
            <p className="mt-1 text-sm text-blue-800">
              You have <strong>{trialStatus.daysRemaining} day{trialStatus.daysRemaining !== 1 ? "s" : ""}</strong> remaining in your free trial. Upgrade now to continue using ResiGrid after your trial expires.
            </p>
          </div>
          <Link
            href="/pm/checkout"
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    );
  }

  if (trialStatus.trialExpired && !isActive) {
    return (
      <div className="rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-50/50 p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-red-900">
              🔒 Trial Expired - Access Paused
            </h3>
            <p className="mt-1 text-sm text-red-800">
              Your free trial has ended. Activate a paid plan to restore full access to your properties, listings, and tenant management tools.
            </p>
          </div>
          <Link
            href="/pm/checkout?reason=trial_expired"
            className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition"
          >
            Activate Plan
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
