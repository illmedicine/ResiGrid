"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { Award } from "lucide-react";
import { listingsCol } from "@/lib/firebase/firestore";
import { usePMSubscription } from "@/lib/hooks/usePMSubscription";
import { allPMBadgesWithStatus } from "@/lib/badges/pmBadges";
import { Card, CardContent } from "@/components/ui/Card";

const TIER_LABEL: Record<string, string> = {
  starter: "Starter Grid",
  growth: "Growth Grid",
  mega: "Mega Grid",
};

const TIER_CLASS: Record<string, string> = {
  starter: "bg-orange-50 text-orange-700 border border-orange-200",
  growth: "bg-navy-900/10 text-navy-900 border border-navy-900/20",
  mega: "bg-amber-50 text-amber-700 border border-amber-300",
};

interface Props {
  uid: string;
}

export function PMBadgeSection({ uid }: Props) {
  const { sub } = usePMSubscription(uid);
  const [listingCount, setListingCount] = useState(0);

  useEffect(() => {
    const q = query(listingsCol(), where("ownerId", "==", uid));
    return onSnapshot(q, (snap) => setListingCount(snap.size));
  }, [uid]);

  const tier = sub?.tier;
  const badges = allPMBadgesWithStatus(tier, listingCount);
  const earnedBadges = badges.filter((b) => b.earned);

  return (
    <Card className="p-5">
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-navy-900">Achievements</h2>
            <p className="text-xs text-neutral-500">Your ResiGrid property manager standing</p>
          </div>
          <Award className="h-5 w-5 text-orange-500" />
        </div>

        {/* Current tier pill */}
        {tier && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${TIER_CLASS[tier] ?? ""}`}>
              {tier === "starter" && "🏗️"}
              {tier === "growth" && "📈"}
              {tier === "mega" && "🌍"}
              {TIER_LABEL[tier]}
            </span>
            {sub?.tierExpiresAt && (
              <span className="text-[10px] text-neutral-400">
                Renews {new Date(sub.tierExpiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Badge grid */}
        <div className="grid grid-cols-3 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              title={badge.earned ? badge.description : `Locked — ${badge.description}`}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                badge.earned
                  ? badge.badgeClass
                  : "border-neutral-100 bg-neutral-50 opacity-35 grayscale"
              }`}
            >
              <span className="text-2xl">{badge.emoji}</span>
              <p className="text-[10px] font-semibold leading-tight">{badge.label}</p>
              {badge.earned && (
                <p className="text-[9px] text-current opacity-70 leading-tight">
                  {badge.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Unlocking hints */}
        {badges.some((b) => !b.earned) && (
          <div className="border-t border-neutral-100 pt-3">
            <p className="text-[10px] font-medium text-neutral-500 mb-1.5">How to unlock</p>
            <ul className="flex flex-col gap-1">
              {badges
                .filter((b) => !b.earned)
                .map((b) => (
                  <li key={b.id} className="flex items-start gap-1.5 text-[10px] text-neutral-500">
                    <span className="mt-px opacity-50">{b.emoji}</span>
                    <span>
                      <strong className="text-neutral-700">{b.label}</strong> — {b.description}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {earnedBadges.length === 0 && (
          <p className="text-xs text-neutral-500">
            Post a listing to earn your first badge. Upgrade your plan to unlock Realtor and Colonizer status.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
