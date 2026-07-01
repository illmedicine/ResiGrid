"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  MessageSquare,
  Star,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  XCircle,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { messageThreadsCol, threadMessagesCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useUserDisplayName } from "@/lib/hooks/useUserDisplayName";
import { computeScore } from "@/lib/reputation/badges";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
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
  const { user } = useAuth();
  const tenantName = useUserDisplayName(application.tenantId);
  const [reputation, setReputation] = useState<ReputationScoreDoc | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);
  const [noteMode, setNoteMode] = useState<"more_info" | "deny" | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "reputationScores", application.tenantId),
      (snap) => {
        setReputation(snap.exists() ? (snap.data() as ReputationScoreDoc) : null);
      },
    );
    return unsub;
  }, [application.tenantId]);

  async function setStatus(
    status: ApplicationDoc["status"],
    extra?: Partial<ApplicationDoc>,
  ) {
    setWorking(true);
    try {
      await updateDoc(doc(db, "applications", application.id), {
        status,
        decidedAt: Date.now(),
        ...extra,
      });
    } finally {
      setWorking(false);
      setNoteMode(null);
      setNote("");
    }
  }

  async function sendDM(content: string) {
    if (!user) return;
    // Find or create a message thread between this PM and the tenant
    const threadRef = doc(messageThreadsCol());
    await setDoc(threadRef, {
      id: threadRef.id,
      participantIds: [user.uid, application.tenantId],
      propertyId: undefined,
      leaseId: undefined,
      lastMessageAt: Date.now(),
      lastMessageSnippet: content.slice(0, 80),
    });
    await addDoc(threadMessagesCol(threadRef.id), {
      id: "",
      threadId: threadRef.id,
      senderId: user.uid,
      content,
      createdAt: Date.now(),
      readBy: [user.uid],
    });
  }

  async function handleShortlist() {
    setWorking(true);
    try {
      await setStatus("shortlisted");
      await sendDM(
        `🎉 Congratulations! You have been shortlisted for the property you expressed interest in. ` +
        `We would like to invite you to submit a formal application. Please check your Applications tab to proceed.`,
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleInvite() {
    setWorking(true);
    try {
      await setStatus("invited", { invitedAt: Date.now() });
      await sendDM(
        `You have been officially invited to apply! ` +
        `Please visit your Applications tab on ResiGrid to complete and submit your application.`,
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleApprove() {
    await setStatus("approved");
    await sendDM(
      `✅ Great news! Your application has been approved. ` +
      `The property manager will be in touch shortly to finalize your move-in details and send your lease agreement.`,
    );
  }

  async function handleDeny() {
    await setStatus("denied", { decisionNote: note });
    await sendDM(
      note
        ? `We have reviewed your application and unfortunately it was not selected at this time. Note from the property manager: ${note}`
        : `We have reviewed your application and unfortunately it was not selected at this time. Thank you for your interest.`,
    );
  }

  async function handleMoreInfo() {
    await setStatus("more_info_needed", { decisionNote: note });
    await sendDM(
      `We need a bit more information to continue reviewing your application. ` +
      (note ? `Details: ${note}` : `Please check your Applications tab for guidance.`),
    );
  }

  const score = reputation
    ? computeScore(reputation.onTimeCount, reputation.lateCount)
    : null;
  const cfg = STATUS_CONFIG[application.status];
  const isActionable = ["submitted", "under_review", "shortlisted", "invited", "more_info_needed"].includes(
    application.status,
  );

  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-navy-900">
              {tenantName ?? application.tenantId}
            </p>
            <p className="text-xs text-neutral-500 font-mono">
              UID: {application.tenantId}
            </p>
            <p className="text-xs text-neutral-600">
              {application.submittedAt
                ? `Applied ${new Date(application.submittedAt).toLocaleDateString()}`
                : "Interest expressed"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={cfg.tone}>{cfg.label}</Badge>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Reputation row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
          <span>
            RGE Score:{" "}
            <strong className="text-navy-900">
              {score === null ? "No history" : `${score}%`}
            </strong>
          </span>
          {reputation && (
            <span>
              {reputation.onTimeCount} on-time · {reputation.lateCount} late
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

        {/* Expanded: application answers */}
        {expanded && (
          <div className="mt-1 rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-700 space-y-1">
            {application.message && (
              <p><span className="font-medium">Message:</span> {application.message}</p>
            )}
            {application.monthlyIncome && (
              <p><span className="font-medium">Monthly income:</span> ${application.monthlyIncome.toLocaleString()}</p>
            )}
            {application.employer && (
              <p><span className="font-medium">Employer:</span> {application.employer}</p>
            )}
            {application.emergencyContactName && (
              <p><span className="font-medium">Emergency contact:</span> {application.emergencyContactName}{application.emergencyContactPhone ? ` · ${application.emergencyContactPhone}` : ""}</p>
            )}
            {application.moveInDate && (
              <p><span className="font-medium">Desired move-in:</span> {new Date(application.moveInDate).toLocaleDateString()}</p>
            )}
            {application.documentUrls && application.documentUrls.length > 0 && (
              <div>
                <p className="font-medium mb-1">Uploaded documents:</p>
                <ul className="flex flex-col gap-1">
                  {application.documentUrls.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:underline"
                      >
                        Document {i + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {application.decisionNote && (
              <p><span className="font-medium">Note:</span> {application.decisionNote}</p>
            )}
          </div>
        )}

        {/* Action buttons */}
        {isActionable && !noteMode && (
          <div className="flex flex-wrap gap-2 pt-1">
            {application.status === "submitted" || application.status === "under_review" || application.status === "more_info_needed" ? (
              <>
                {!["shortlisted", "invited"].includes(application.status) && (
                  <Button size="sm" variant="outline" onClick={handleShortlist} disabled={working}>
                    <Star className="h-3.5 w-3.5" />
                    Shortlist
                  </Button>
                )}
                <Button size="sm" onClick={handleApprove} disabled={working}>
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNoteMode("more_info")}
                  disabled={working}
                >
                  <Info className="h-3.5 w-3.5" />
                  Need More Info
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNoteMode("deny")}
                  disabled={working}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  Deny
                </Button>
              </>
            ) : application.status === "shortlisted" ? (
              <Button size="sm" onClick={handleInvite} disabled={working}>
                <UserCheck className="h-3.5 w-3.5" />
                Send Invite to Apply
              </Button>
            ) : application.status === "invited" ? (
              <p className="text-xs text-neutral-500 italic">
                Invitation sent — awaiting tenant application.
              </p>
            ) : null}
          </div>
        )}

        {/* Note input for deny / more info */}
        {noteMode && (
          <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <Textarea
              label={noteMode === "deny" ? "Reason for denial (optional)" : "What information is needed?"}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                noteMode === "deny"
                  ? "e.g. Income requirements not met"
                  : "e.g. Please provide last 2 months of paystubs"
              }
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={noteMode === "deny" ? handleDeny : handleMoreInfo}
                disabled={working}
                className={noteMode === "deny" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                {working ? "Sending…" : noteMode === "deny" ? "Confirm Denial" : "Send Request"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setNoteMode(null); setNote(""); }}
                disabled={working}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Finalized states */}
        {application.status === "approved" && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Application approved. Proceed to create a lease for this tenant.
            <Button href="/pm/leases/new" size="sm" className="ml-auto">
              Create lease
            </Button>
          </div>
        )}
        {application.status === "denied" && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            <XCircle className="h-4 w-4 shrink-0" />
            Application denied.
            {application.decisionNote && (
              <span className="ml-1 text-neutral-600">Reason: {application.decisionNote}</span>
            )}
          </div>
        )}

        {/* Message tenant quick link */}
        <div className="flex justify-end">
          <Button href="/pm/messages" size="sm" variant="outline">
            <MessageSquare className="h-3.5 w-3.5" />
            Message tenant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
