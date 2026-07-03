"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  addDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  ArrowLeft,
  CheckCircle2,
  Info,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  XCircle,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { messageThreadsCol, threadMessagesCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { ApplicationPreviewDoc } from "@/components/shared/ApplicationPreviewDoc";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import type { ApplicationDoc, ApplicationFormDoc, ListingDoc } from "@/lib/types/models";

function PmApplicationViewContent() {
  const { user } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") ?? "";

  const [application, setApplication] = useState<ApplicationDoc | null>(null);
  const [listing, setListing] = useState<ListingDoc | null>(null);
  const [formDoc, setFormDoc] = useState<ApplicationFormDoc | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [noteMode, setNoteMode] = useState<"more_info" | "deny" | null>(null);
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    return onSnapshot(doc(db, "applications", id), (snap) => {
      if (snap.exists()) setApplication({ ...snap.data(), id: snap.id } as ApplicationDoc);
      else setApplication(null);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!application?.id) return;

    getDoc(doc(db, "listings", application.listingId)).then((snap) => {
      if (snap.exists()) setListing({ ...snap.data(), id: snap.id } as ListingDoc);
    });

    getDoc(doc(db, "users", application.tenantId)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setTenantName(d.displayName ?? d.email ?? "");
        setTenantEmail(d.email ?? "");
      }
    });

    if (application.applicationFormId) {
      getDoc(doc(db, "applicationForms", application.applicationFormId)).then((snap) => {
        if (snap.exists()) setFormDoc({ ...snap.data(), id: snap.id } as ApplicationFormDoc);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.id]);

  async function sendDM(content: string) {
    if (!user || !application) return;
    const threadId = [user.uid, application.tenantId].sort().join("_");
    const threadRef = doc(messageThreadsCol(), threadId);
    await setDoc(
      threadRef,
      {
        id: threadId,
        participantIds: [user.uid, application.tenantId],
        lastMessageAt: Date.now(),
        lastMessageSnippet: content.slice(0, 80),
      },
      { merge: true },
    );
    await addDoc(threadMessagesCol(threadId), {
      id: "",
      threadId,
      senderId: user.uid,
      content,
      createdAt: Date.now(),
      readBy: [user.uid],
    });
  }

  async function setStatus(
    status: ApplicationDoc["status"],
    extra?: Partial<ApplicationDoc>,
  ) {
    if (!application) return;
    await updateDoc(doc(db, "applications", application.id), {
      status,
      decidedAt: Date.now(),
      ...extra,
    });
  }

  async function handleMarkUnderReview() {
    setWorking(true);
    try { await setStatus("under_review"); } finally { setWorking(false); }
  }

  async function handleShortlist() {
    setWorking(true);
    try {
      await setStatus("shortlisted");
      await sendDM(
        "🎉 You have been shortlisted! We would like to invite you to submit a formal application. Please check your Applications tab."
      );
    } finally { setWorking(false); }
  }

  async function handleInvite() {
    setWorking(true);
    try {
      await setStatus("invited", { invitedAt: Date.now() });
      await sendDM(
        "You have been officially invited to apply! Visit your Applications tab on ResiGrid to complete and submit your application."
      );
    } finally { setWorking(false); }
  }

  async function handleApprove() {
    setWorking(true);
    try {
      await setStatus("approved");
      await sendDM(
        "✅ Great news! Your application has been approved. The property manager will be in touch to finalize your move-in details and lease."
      );
    } finally { setWorking(false); }
  }

  async function handleMoreInfo() {
    setWorking(true);
    try {
      await setStatus("more_info_needed", { decisionNote: note });
      await sendDM(
        "We need a bit more information to continue reviewing your application." +
          (note ? ` Details: ${note}` : " Please check your Applications tab for guidance.")
      );
      setNoteMode(null);
      setNote("");
    } finally { setWorking(false); }
  }

  async function handleDeny() {
    setWorking(true);
    try {
      await setStatus("denied", { decisionNote: note });
      await sendDM(
        note
          ? `Thank you for applying. After careful review, your application was not selected. Note: ${note}`
          : "Thank you for applying. After careful review, your application was not selected at this time."
      );
      setNoteMode(null);
      setNote("");
    } finally { setWorking(false); }
  }

  if (loading) {
    return <p className="p-6 text-sm text-neutral-600">Loading application…</p>;
  }
  if (!application) {
    return <p className="p-6 text-sm text-red-600">Application not found.</p>;
  }

  const isReviewable = ["submitted", "under_review", "more_info_needed"].includes(
    application.status,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col gap-6">
      {/* Nav */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-lg font-bold text-navy-900">Application Review</h1>
          <p className="text-xs text-neutral-500">
            {tenantName || application.tenantId}
            {listing ? ` · ${listing.title}` : ""}
          </p>
        </div>
      </div>

      {/* Document */}
      <ApplicationPreviewDoc
        application={application}
        tenantName={tenantName || application.tenantId}
        tenantEmail={tenantEmail}
        listing={
          listing
            ? {
                title: listing.title,
                city: listing.city,
                state: listing.state,
                zip: listing.zip,
                rent: listing.rent,
                addressLine1: listing.addressLine1,
                beds: listing.beds,
                baths: listing.baths,
              }
            : null
        }
        formDoc={formDoc}
      />

      {/* Action panel */}
      <Card className="p-4">
        <CardContent className="flex flex-col gap-4 p-0">
          <h2 className="text-sm font-semibold text-navy-900">Actions</h2>

          {/* Reviewable: submitted / under_review / more_info_needed */}
          {isReviewable && !noteMode && (
            <div className="flex flex-wrap gap-2">
              {application.status === "submitted" && (
                <Button size="sm" variant="outline" onClick={handleMarkUnderReview} disabled={working}>
                  Mark Under Review
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
                Request More Info
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
            </div>
          )}

          {/* Note textarea (deny or more info) */}
          {noteMode && (
            <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <Textarea
                label={
                  noteMode === "deny"
                    ? "Reason for denial (optional)"
                    : "What additional information is needed?"
                }
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  noteMode === "deny"
                    ? "e.g. Income requirements not met"
                    : "e.g. Please provide last 2 months of paystubs and government-issued photo ID"
                }
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={noteMode === "deny" ? handleDeny : handleMoreInfo}
                  disabled={working}
                  className={noteMode === "deny" ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  {working
                    ? "Sending…"
                    : noteMode === "deny"
                    ? "Confirm Denial"
                    : "Send Request"}
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

          {/* Shortlisted */}
          {application.status === "shortlisted" && (
            <Button size="sm" onClick={handleInvite} disabled={working}>
              <UserCheck className="h-3.5 w-3.5" />
              Send invitation to apply
            </Button>
          )}

          {/* Invited */}
          {application.status === "invited" && (
            <p className="text-sm text-neutral-500 italic">
              Invitation sent — awaiting the applicant&apos;s form submission.
            </p>
          )}

          {/* Approved */}
          {application.status === "approved" && (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Application approved.
              <Button
                href={`/pm/leases/new?tenantId=${application.tenantId}&listingId=${application.listingId}`}
                size="sm"
                className="ml-auto"
              >
                Create lease →
              </Button>
            </div>
          )}

          {/* Denied */}
          {application.status === "denied" && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <XCircle className="h-4 w-4 shrink-0" />
              Application denied.
              {application.decisionNote && (
                <span className="ml-1 text-neutral-600">
                  Reason: {application.decisionNote}
                </span>
              )}
            </div>
          )}

          {/* Withdrawn */}
          {application.status === "withdrawn" && (
            <p className="text-sm text-neutral-500 italic">
              This application has been withdrawn by the applicant.
            </p>
          )}

          {/* Message tenant */}
          <div className="flex items-center justify-between border-t pt-3 flex-wrap gap-2">
            <span className="text-xs text-neutral-400">
              Messages are sent to the tenant&apos;s inbox.
            </span>
            <Button href="/pm/messages" size="sm" variant="outline">
              <MessageSquare className="h-3.5 w-3.5" />
              Message tenant
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PmApplicationViewPage() {
  return (
    <Suspense>
      <PmApplicationViewContent />
    </Suspense>
  );
}
