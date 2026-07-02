"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { Award } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BADGE_DEFINITIONS } from "@/lib/reputation/badges";
import { getPrestigeTier, getPrestigeProgress, PRESTIGE_TIERS } from "@/lib/rge/prestige";
import type { ReputationScoreDoc } from "@/lib/types/models";

export function ReputationSummary({ tenantId }: { tenantId: string }) {
  const [score, setScore] = useState<ReputationScoreDoc | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "reputationScores", tenantId), (snap) => {
      setScore(snap.exists() ? (snap.data() as ReputationScoreDoc) : null);
    });
    return unsub;
  }, [tenantId]);

  const onTime = score?.onTimeCount ?? 0;
  const late = score?.lateCount ?? 0;
  const streak = score?.currentStreak ?? 0;
  const total = onTime + late;
  const pct = total > 0 ? Math.round((onTime / total) * 100) : null;
  const rgeScore = score?.score ?? 0;
  const prestige = getPrestigeTier(rgeScore);
  const progress = getPrestigeProgress(rgeScore);

  return (
    <Card className="p-5">
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-navy-900">RGE Score & Reputation</h2>
            <p className="text-xs text-neutral-500">Residential Grid Economy standing</p>
          </div>
          <Award className="h-5 w-5 text-orange-500" />
        </div>

        {/* Prestige tier badge */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${prestige.badgeClass}`}
          >
            <span className="text-base">{prestige.emoji}</span>
            {prestige.label}
          </span>
          <span className="text-2xl font-bold text-navy-900">{rgeScore.toLocaleString()}</span>
          <span className="text-xs text-neutral-500">RGE pts</span>
        </div>

        {/* Progress to next tier */}
        {progress.nextTier && (
          <div>
            <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
              <span>{prestige.label}</span>
              <span>{progress.nextTier.emoji} {progress.nextTier.label} in {progress.pointsNeeded} pts</span>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-400 transition-all duration-700"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Tier ladder */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {PRESTIGE_TIERS.map((tier, i) => (
            <div key={tier.tier} className="flex items-center gap-1">
              <span
                title={`${tier.label} (${tier.minScore}+ pts)`}
                className={`text-base ${rgeScore >= tier.minScore ? "" : "opacity-30 grayscale"}`}
              >
                {tier.emoji}
              </span>
              {i < PRESTIGE_TIERS.length - 1 && (
                <div className={`h-px w-4 ${rgeScore >= PRESTIGE_TIERS[i + 1].minScore ? "bg-orange-400" : "bg-neutral-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Payment stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="On-time" value={onTime} />
          <Stat label="Streak" value={streak} />
          <Stat label="On-time %" value={pct === null ? "—" : `${pct}%`} />
        </div>

        {score && score.badges.length > 0 ? (
          <div className="flex flex-col gap-2">
            {/* Resident badge gets a featured callout */}
            {score.badges.find((b) => b.id === "resident") && (
              <div className="flex items-center gap-2 rounded-xl border border-navy-900/15 bg-navy-900/5 px-3 py-2">
                <span className="text-xl">🏠</span>
                <div>
                  <p className="text-xs font-semibold text-navy-900">Resident</p>
                  <p className="text-[10px] text-neutral-500">
                    Signed lease · Member of the Residential Grid Economy
                  </p>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {score.badges
                .filter((b) => b.id !== "resident")
                .map((badge) => (
                  <Badge key={badge.id} tone="orange">
                    {badge.label}
                  </Badge>
                ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-500">
            Sign a lease to earn your Resident badge, then make on-time payments
            to build your RGE score.{" "}
            {BADGE_DEFINITIONS.filter((b) => b.id !== "resident")
              .map((b) => b.label)
              .join(" · ")}
          </p>
        )}

        <p className="text-[10px] text-neutral-400 border-t border-neutral-100 pt-2">
          {prestige.description} · Active lease holders earn higher standing in the Residential Grid Economy.
        </p>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-lg font-bold text-navy-900">{value}</div>
      <div className="text-xs text-neutral-600">{label}</div>
    </div>
  );
}
