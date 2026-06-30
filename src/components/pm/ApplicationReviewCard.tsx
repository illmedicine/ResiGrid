"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useUserDisplayName } from "@/lib/hooks/useUserDisplayName";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { computeScore } from "@/lib/reputation/badges";
import type { ApplicationDoc, ReputationScoreDoc } from "@/lib/types/models";

export function ApplicationReviewCard({
  application,
}: {
  application: ApplicationDoc;
}) {
  const tenantName = useUserDisplayName(application.tenantId);
  const [reputation, setReputation] = useState<ReputationScoreDoc | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "reputationScores", application.tenantId),
      (snap) => {
        setReputation(snap.exists() ? (snap.data() as ReputationScoreDoc) : null);
      },
    );
    return unsub;
  }, [application.tenantId]);

  async function setStatus(status: ApplicationDoc["status"]) {
    await updateDoc(doc(db, "applications", application.id), { status });
  }

  const score = reputation
    ? computeScore(reputation.onTimeCount, reputation.lateCount)
    : null;

  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-navy-900">
              {tenantName ?? application.tenantId}
            </p>
            <p className="text-xs text-neutral-600">
              Applied {new Date(application.submittedAt).toLocaleDateString()}
            </p>
          </div>
          <Badge tone="navy">{application.status.replace("_", " ")}</Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-neutral-600">
          <span>
            Reputation score:{" "}
            <strong className="text-navy-900">
              {score === null ? "No history" : `${score}%`}
            </strong>
          </span>
          {reputation && (
            <span>
              {reputation.onTimeCount} on-time / {reputation.lateCount} late
            </span>
          )}
        </div>

        {reputation && reputation.badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {reputation.badges.map((badge) => (
              <Badge key={badge.id} tone="orange">
                {badge.label}
              </Badge>
            ))}
          </div>
        )}

        {application.status === "submitted" ||
        application.status === "under_review" ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setStatus("approved")}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatus("denied")}
            >
              Deny
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
