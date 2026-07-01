"use client";

import Link from "next/link";
import { AlertCircle, Clock, Sparkles } from "lucide-react";
import type { TrialStatus } from "@/lib/hooks/usePMSubscription";

interface TrialBannerProps {
  trial: TrialStatus;
}

export function TrialBanner({ trial }: TrialBannerProps) {
  if (!trial.inTrial) return null;

  const isUrgent = trial.hoursRemaining <= 24;
  const isCritical = trial.hoursRemaining <= 6;

  const timeLabel = isCritical
    ? `${trial.hoursRemaining} hour${trial.hoursRemaining !== 1 ? "s" : ""}`
    : isUrgent
      ? `${trial.hoursRemaining} hour${trial.hoursRemaining !== 1 ? "s" : ""}`
      : `${trial.daysRemaining} day${trial.daysRemaining !== 1 ? "s" : ""}`;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
        isCritical
          ? "bg-red-600 text-white"
          : isUrgent
            ? "bg-orange-500 text-white"
            : "bg-navy-900 text-white"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isCritical ? (
          <AlertCircle className="h-4 w-4 shrink-0" />
        ) : isUrgent ? (
          <Clock className="h-4 w-4 shrink-0" />
        ) : (
          <Sparkles className="h-4 w-4 shrink-0" />
        )}
        <span className="truncate">
          {isCritical
            ? `⚠️ Free trial ends in ${timeLabel} — activate to keep your access.`
            : isUrgent
              ? `Trial ends in ${timeLabel}. Activate now to keep full access.`
              : `🎉 Free trial — ${timeLabel} remaining. Full Property Management access included.`}
        </span>
      </div>

      <Link
        href="/pm/checkout?reason=trial"
        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          isCritical
            ? "bg-white text-red-600 hover:bg-red-50"
            : isUrgent
              ? "bg-white text-orange-600 hover:bg-orange-50"
              : "bg-orange-500 text-white hover:bg-orange-600"
        }`}
      >
        Activate — $40
      </Link>
    </div>
  );
}
