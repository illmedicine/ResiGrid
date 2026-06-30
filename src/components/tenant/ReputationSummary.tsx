"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { Award } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BADGE_DEFINITIONS } from "@/lib/reputation/badges";
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

  return (
    <Card className="p-5">
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-900">
            Payment reputation
          </h2>
          <Award className="h-5 w-5 text-orange-500" />
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="On-time" value={onTime} />
          <Stat label="Streak" value={streak} />
          <Stat label="On-time %" value={pct === null ? "—" : `${pct}%`} />
        </div>

        {score && score.badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {score.badges.map((badge) => (
              <Badge key={badge.id} tone="orange">
                {badge.label}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-600">
            Make on-time payments to start earning badges. Available badges:{" "}
            {BADGE_DEFINITIONS.map((b) => b.label).join(", ")}.
          </p>
        )}
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
