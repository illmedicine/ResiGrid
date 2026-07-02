export type PMTier = "starter" | "growth" | "mega";

export interface TierConfig {
  id: PMTier;
  name: string;
  tagline: string;
  annualFee: number;
  monthlyUnitFee: number;
  maxProperties: number | null;
  maxUnitsPerProperty: number | null;
  maxTotalUnits: number | null;
  capacityLabel: string;
}

export const PM_TIERS: Record<PMTier, TierConfig> = {
  starter: {
    id: "starter",
    name: "Starter Grid",
    tagline: "Perfect for small landlords",
    annualFee: 40,
    monthlyUnitFee: 1,
    maxProperties: 1,
    maxUnitsPerProperty: 20,
    maxTotalUnits: 20,
    capacityLabel: "1 Property · Up to 20 Units",
  },
  growth: {
    id: "growth",
    name: "Growth Grid",
    tagline: "Scale your portfolio",
    annualFee: 80,
    monthlyUnitFee: 1,
    maxProperties: 5,
    maxUnitsPerProperty: 20,
    maxTotalUnits: 100,
    capacityLabel: "Up to 5 Properties · 100 Units total",
  },
  mega: {
    id: "mega",
    name: "Mega Grid",
    tagline: "Enterprise — unlimited everything",
    annualFee: 400,
    monthlyUnitFee: 1,
    maxProperties: null,
    maxUnitsPerProperty: null,
    maxTotalUnits: null,
    capacityLabel: "Unlimited Properties & Units",
  },
};

export const TIER_ORDER: PMTier[] = ["starter", "growth", "mega"];

export function getTierFee(tier: PMTier): number {
  return PM_TIERS[tier].annualFee;
}

/** Estimate monthly SaaS cost for a given number of occupied units. */
export function estimateMonthlySaasFee(occupiedUnits: number): number {
  return Math.max(0, occupiedUnits) * 1;
}

/** Human-readable annual billing summary for checkout display. */
export function tierCheckoutSummary(tier: PMTier, occupiedUnits = 0): string {
  const config = PM_TIERS[tier];
  const monthly = estimateMonthlySaasFee(occupiedUnits);
  if (occupiedUnits > 0) {
    return `$${config.annualFee}/yr onboarding + $${monthly}/mo for ${occupiedUnits} occupied unit${occupiedUnits !== 1 ? "s" : ""}`;
  }
  return `$${config.annualFee} annual onboarding · $1/mo per occupied unit`;
}
