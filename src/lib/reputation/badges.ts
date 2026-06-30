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

export function computeScore(onTimeCount: number, lateCount: number): number {
  const total = onTimeCount + lateCount;
  if (total === 0) return 0;
  return Math.round((onTimeCount / total) * 100);
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
