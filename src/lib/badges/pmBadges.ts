import type { PMTier } from "@/lib/pricing/fees";

export interface PMBadgeDef {
  id: string;
  emoji: string;
  label: string;
  description: string;
  tier: "starter" | "growth" | "mega" | "listing";
  badgeClass: string;
}

export const PM_BADGE_DEFS: PMBadgeDef[] = [
  {
    id: "dwellar_seller_starter",
    emoji: "🏘️",
    label: "Dwellar Seller Starter",
    description: "Posted your first property listing on the ResiGrid network.",
    tier: "listing",
    badgeClass: "bg-orange-50 text-orange-700 border border-orange-200",
  },
  {
    id: "realtor",
    emoji: "🤝",
    label: "Realtor",
    description: "Upgraded to Growth Grid — managing a multi-property portfolio.",
    tier: "growth",
    badgeClass: "bg-navy-900/10 text-navy-900 border border-navy-900/20",
  },
  {
    id: "colonizer",
    emoji: "🌍",
    label: "Colonizer",
    description: "Achieved Mega Grid status — unlimited portfolio on the Residential Grid Economy.",
    tier: "mega",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-300",
  },
];

/** Returns which PM badges are currently earned based on tier + listing count. */
export function computePMBadges(
  pmTier: PMTier | undefined,
  listingCount: number,
): PMBadgeDef[] {
  const earned: PMBadgeDef[] = [];

  if (listingCount > 0) {
    earned.push(PM_BADGE_DEFS.find((b) => b.id === "dwellar_seller_starter")!);
  }
  if (pmTier === "growth" || pmTier === "mega") {
    earned.push(PM_BADGE_DEFS.find((b) => b.id === "realtor")!);
  }
  if (pmTier === "mega") {
    earned.push(PM_BADGE_DEFS.find((b) => b.id === "colonizer")!);
  }

  return earned;
}

/** Returns all badges, marking each as earned or locked. */
export function allPMBadgesWithStatus(
  pmTier: PMTier | undefined,
  listingCount: number,
): Array<PMBadgeDef & { earned: boolean }> {
  const earnedIds = new Set(computePMBadges(pmTier, listingCount).map((b) => b.id));
  return PM_BADGE_DEFS.map((b) => ({ ...b, earned: earnedIds.has(b.id) }));
}
