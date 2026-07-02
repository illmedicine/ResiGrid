export type PrestigeTier = "spark" | "resident" | "verified" | "premier" | "prestige";

export interface PrestigeTierDef {
  tier: PrestigeTier;
  label: string;
  minScore: number;
  emoji: string;
  badgeClass: string;
  description: string;
}

export const PRESTIGE_TIERS: PrestigeTierDef[] = [
  {
    tier: "spark",
    label: "Spark",
    minScore: 0,
    emoji: "✦",
    badgeClass: "bg-neutral-100 text-neutral-600 border border-neutral-200",
    description: "New to ResiGrid",
  },
  {
    tier: "resident",
    label: "Resident",
    minScore: 100,
    emoji: "🏠",
    badgeClass: "bg-navy-900/10 text-navy-900 border border-navy-900/20",
    description: "Active ResiGrid member with a verified address",
  },
  {
    tier: "verified",
    label: "Verified Resident",
    minScore: 300,
    emoji: "✅",
    badgeClass: "bg-orange-50 text-orange-700 border border-orange-200",
    description: "Consistent payer recognized across the platform",
  },
  {
    tier: "premier",
    label: "Premier Member",
    minScore: 600,
    emoji: "⭐",
    badgeClass: "bg-green-50 text-green-700 border border-green-200",
    description: "Elite standing in the Residential Grid Economy",
  },
  {
    tier: "prestige",
    label: "Prestige Elite",
    minScore: 1000,
    emoji: "👑",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-300",
    description: "Top-tier member of the Residential Grid Economy",
  },
];

export function getPrestigeTier(rgeScore: number): PrestigeTierDef {
  let result = PRESTIGE_TIERS[0];
  for (const tier of PRESTIGE_TIERS) {
    if (rgeScore >= tier.minScore) result = tier;
  }
  return result;
}

export function getPrestigeProgress(rgeScore: number): {
  pct: number;
  nextTier: PrestigeTierDef | null;
  pointsNeeded: number;
} {
  const current = getPrestigeTier(rgeScore);
  const idx = PRESTIGE_TIERS.findIndex((t) => t.tier === current.tier);
  const next = PRESTIGE_TIERS[idx + 1] ?? null;
  if (!next) return { pct: 100, nextTier: null, pointsNeeded: 0 };
  const rangeSize = next.minScore - current.minScore;
  const earned = rgeScore - current.minScore;
  return {
    pct: Math.min(100, Math.round((earned / rangeSize) * 100)),
    nextTier: next,
    pointsNeeded: next.minScore - rgeScore,
  };
}
