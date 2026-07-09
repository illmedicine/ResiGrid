export interface BadgeDefinition {
  id: string;
  label: string;
  description: string;
  /** Minimum consecutive on-time payments required */
  streakThreshold?: number;
  /** Minimum total on-time payments required */
  onTimeCountThreshold?: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "resident",
    label: "🏠 Resident",
    description: "Signed a lease and joined the Residential Grid Economy.",
    // Awarded by Cloud Function on lease signing — not threshold-based.
  },
  {
    id: "first_payment",
    label: "First Payment",
    description: "Made your first on-time rent payment on ResiGrid.",
    onTimeCountThreshold: 1,
  },
  {
    id: "six_month_streak",
    label: "6-Month Streak",
    description: "6 consecutive on-time rent payments.",
    streakThreshold: 6,
  },
  {
    id: "twelve_month_streak",
    label: "12-Month Streak",
    description: "12 consecutive on-time rent payments.",
    streakThreshold: 12,
  },
  {
    id: "twenty_four_month_streak",
    label: "2-Year Streak",
    description: "24 consecutive on-time rent payments.",
    streakThreshold: 24,
  },
  {
    id: "always_on_time_25",
    label: "Always On Time",
    description: "25 total on-time payments with no late payments.",
    onTimeCountThreshold: 25,
  },
];

/** Points awarded per application/document a tenant has on file, capped. */
const ENGAGEMENT_POINTS_PER_DOC = 20;
const ENGAGEMENT_POINTS_CAP = 100;

/**
 * Points-based RGE score with headroom above 100 — PRESTIGE_TIERS
 * (src/lib/rge/prestige.ts) goes up to 1000, so a flat 0-100 ratio could
 * never reach the top tiers. `activeLeaseCount` rewards tenants holding more
 * than one concurrent signed lease. `docsSubmitted` (applications + shared
 * documents on file, across all PMs) rewards tenants who've built out a
 * fuller verified paper trail.
 */
export function computeScore(
  onTimeCount: number,
  lateCount: number,
  currentStreak = 0,
  activeLeaseCount = 1,
  docsSubmitted = 0,
  taskBonusPoints = 0,
): number {
  const total = onTimeCount + lateCount;
  const onTimeRatio = total === 0 ? 0 : onTimeCount / total;
  const basePoints = Math.round(onTimeRatio * 300); // payment reliability
  const volumePoints = Math.min(onTimeCount * 4, 400); // track record depth
  const streakPoints = Math.min(currentStreak * 8, 200); // consecutive streak
  const leasePoints = Math.max(0, activeLeaseCount - 1) * 60; // extra concurrent leases
  const engagementPoints = Math.min(docsSubmitted * ENGAGEMENT_POINTS_PER_DOC, ENGAGEMENT_POINTS_CAP);
  return Math.round(basePoints + volumePoints + streakPoints + leasePoints + engagementPoints + taskBonusPoints);
}

export function earnedBadgeIds(
  onTimeCount: number,
  currentStreak: number,
): string[] {
  return BADGE_DEFINITIONS.filter((badge) => {
    if (badge.streakThreshold && currentStreak >= badge.streakThreshold) {
      return true;
    }
    if (
      badge.onTimeCountThreshold &&
      onTimeCount >= badge.onTimeCountThreshold
    ) {
      return true;
    }
    return false;
  }).map((badge) => badge.id);
}
