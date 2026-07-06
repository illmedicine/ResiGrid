"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useUserDisplayName } from "@/lib/hooks/useUserDisplayName";
import { computeScore } from "@/lib/reputation/badges";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { ApplicationDoc, ReputationScoreDoc } from "@/lib/types/models";

const STATUS_CONFIG: Record<
  ApplicationDoc["status"],
  { label: string; tone: "neutral" | "navy" | "success" | "danger" | "orange" }
> = {
  shortlisted: { label: "Shortlisted", tone: "orange" },
  invited: { label: "Invited to Apply", tone: "navy" },
  submitted: { label: "Submitted", tone: "neutral" },
  under_review: { label: "Under Review", tone: "navy" },
  more_info_needed: { label: "More Info Needed", tone: "orange" },
  approved: { label: "Approved", tone: "success" },
  denied: { label: "Denied", tone: "danger" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
};

export function ApplicationReviewCard({
  application,
}: {
  application: ApplicationDoc;
}) {
  const tenantName = useUserDisplayName(application.tenantId);
  const [reputation, setReputation] = useState<ReputationScoreDoc | null>(null);

  useEffect(() => {
    return onSnapshot(
      doc(db, "reputationScores", application.tenantId),
      (snap) => {
        setReputation(snap.exists() ? (snap.data() as ReputationScoreDoc) : null);
      },
    );
  }, [application.tenantId]);

  const score = reputation
    ? computeScore(reputation.onTimeCount, reputation.lateCount, reputation.currentStreak)
    : null;
  const cfg = STATUS_CONFIG[application.status];
  const needsAction = ["submitted", "more_info_needed"].includes(application.status);

  return (
    <Card
      className={`p-4 transition ${
        needsAction ? "border-orange-200 bg-orange-50/20" : ""
      }`}
    >
      <CardContent className="flex items-center gap-4 p-0 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-navy-900">
              {tenantName ?? application.tenantId}
            </p>
            <Badge tone={cfg.tone}>{cfg.label}</Badge>
            {needsAction && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                Review needed
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
            <span>
              RGE Score:{" "}
              <strong className="text-navy-900">
                {score === null ? "No history" : score}
              </strong>
            </span>
            {reputation && (
              <span>
                {reputation.onTimeCount} on-time · {reputation.lateCount} late
              </span>
            )}
            {reputation && reputation.badges.length > 0 && (
              <span>{reputation.badges.map((b) => b.label).join(" · ")}</span>
            )}
            <span>
              {application.submittedAt
                ? `Applied ${new Date(application.submittedAt).toLocaleDateString()}`
                : "Interest expressed"}
            </span>
          </div>
        </div>

        <Button
          href={`/pm/applications/view/?id=${application.id}`}
          size="sm"
          variant={needsAction ? "primary" : "outline"}
        >
          Review application →
        </Button>
      </CardContent>
    </Card>
  );
}
