"use client";

import { useEffect, useRef, useState } from "react";
import {
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import {
  CheckCircle2,
  FileUp,
  Loader2,
  Trash2,
} from "lucide-react";
import { db, storage } from "@/lib/firebase/config";
import { applicationsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type {
  ApplicationDoc,
  ApplicationStatus,
  ListingDoc,
} from "@/lib/types/models";

const STATUS_TONE: Record<
  ApplicationStatus,
  "neutral" | "navy" | "success" | "danger" | "orange"
> = {
  shortlisted: "orange",
  invited: "orange",
  submitted: "neutral",
  under_review: "navy",
  more_info_needed: "orange",
  approved: "success",
  denied: "danger",
  withdrawn: "neutral",
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  shortlisted: "Shortlisted",
  invited: "Invited to Apply",
  submitted: "Submitted",
  under_review: "Under Review",
  more_info_needed: "More Info Needed",
  approved: "Approved",
  denied: "Denied",
  withdrawn: "Withdrawn",
};

export default function TenantApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      applicationsCol(),
      where("tenantId", "==", user.uid),
      orderBy("submittedAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setApplications(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [user]);

  const invited = applications.filter((a) => a.status === "invited" || a.status === "more_info_needed");
  const others = applications.filter((a) => !["invited", "more_info_needed"].includes(a.status));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">My applications</h1>
        <p className="text-sm text-neutral-600">
          Track your applications and act on invitations from property managers.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : applications.length === 0 ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">
              No applications yet. Browse listings and express interest to get started.
            </p>
            <Button href="/listings" size="sm" className="mt-3">
              Browse listings
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Invitations that require action */}
          {invited.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-orange-600">
                ⚡ Action required — {invited.length} invitation{invited.length !== 1 ? "s" : ""}
              </h2>
              {invited.map((app) => (
                <ApplicationCard key={app.id} application={app} tenantId={user!.uid} actionable />
              ))}
            </div>
          )}

          {/* All other applications */}
          {others.length > 0 && (
            <div className="flex flex-col gap-3">
              {invited.length > 0 && (
                <h2 className="text-sm font-semibold text-navy-900">All applications</h2>
              )}
              {others.map((app) => (
                <ApplicationCard key={app.id} application={app} tenantId={user!.uid} actionable={false} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ApplicationCard({
  application,
  tenantId,
  actionable,
}: {
  application: ApplicationDoc;
  tenantId: string;
  actionable: boolean;
}) {
  const [listing, setListing] = useState<ListingDoc | null>(null);
  const [expanded, setExpanded] = useState(actionable);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>(application.documentUrls ?? []);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [monthlyIncome, setMonthlyIncome] = useState(
    application.monthlyIncome ? String(application.monthlyIncome) : "",
  );
  const [employer, setEmployer] = useState(application.employer ?? "");
  const [emergencyName, setEmergencyName] = useState(application.emergencyContactName ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(application.emergencyContactPhone ?? "");
  const [moveInDate, setMoveInDate] = useState(
    application.moveInDate
      ? new Date(application.moveInDate).toISOString().split("T")[0]
      : "",
  );
  const [message, setMessage] = useState(application.message ?? "");

  useEffect(() => {
    if (!application.listingId || application.listingId.startsWith("demo-")) return;
    const unsub = onSnapshot(doc(db, "listings", application.listingId), (snap) => {
      if (snap.exists()) setListing({ ...snap.data(), id: snap.id } as ListingDoc);
    });
    return unsub;
  }, [application.listingId]);

  async function handleFileUpload(files: FileList) {
    const accepted = Array.from(files).slice(0, 10 - uploadedDocs.length);
    if (!accepted.length) return;
    setUploadingCount((c) => c + accepted.length);
    const newUrls: string[] = [];
    for (const file of accepted) {
      const path = `resigrid/applications/${tenantId}/${application.id}/${Date.now()}-${file.name}`;
      try {
        const sRef = storageRef(storage, path);
        await uploadBytes(sRef, file);
        const url = await getDownloadURL(sRef);
        newUrls.push(url);
      } catch {
        // skip failed uploads silently
      } finally {
        setUploadingCount((c) => c - 1);
      }
    }
    setUploadedDocs((prev) => [...prev, ...newUrls]);
  }

  function removeDoc(index: number) {
    setUploadedDocs((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await updateDoc(doc(db, "applications", application.id), {
        status: "submitted",
        submittedAt: Date.now(),
        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
        employer: employer || undefined,
        emergencyContactName: emergencyName || undefined,
        emergencyContactPhone: emergencyPhone || undefined,
        moveInDate: moveInDate ? new Date(moveInDate).getTime() : undefined,
        message: message || undefined,
        documentUrls: uploadedDocs,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  const tone = STATUS_TONE[application.status];
  const label = STATUS_LABEL[application.status];
  const isInvited = application.status === "invited" || application.status === "more_info_needed";

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50 p-4">
        <CardContent className="flex items-center gap-3 p-0">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Application submitted!</p>
            <p className="text-xs text-green-700">
              The property manager will review your application and respond shortly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${isInvited ? "border-orange-300 bg-orange-50/30" : ""}`}>
      <CardContent className="flex flex-col gap-3 p-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-navy-900">
              {listing?.title ?? `Listing ${application.listingId}`}
            </p>
            {listing && (
              <p className="text-xs text-neutral-500">
                {listing.city}, {listing.state} · ${listing.rent.toLocaleString()}/mo
              </p>
            )}
            <p className="text-xs text-neutral-500">
              {application.submittedAt
                ? `Applied ${new Date(application.submittedAt).toLocaleDateString()}`
                : "Invited"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={tone}>{label}</Badge>
            {isInvited && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-xs font-medium text-orange-600 hover:underline"
              >
                {expanded ? "Collapse" : "Complete application"}
              </button>
            )}
          </div>
        </div>

        {/* Decision note (more info or denial reason) */}
        {application.decisionNote && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800">
            <strong>Note from property manager:</strong> {application.decisionNote}
          </div>
        )}

        {/* Expandable application form (for invited / more_info_needed) */}
        {expanded && isInvited && (
          <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 mt-1">
            <p className="text-xs font-medium text-navy-900">
              Complete your application — the property manager needs the following details:
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Monthly income ($)"
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="e.g. 5000"
              />
              <Input
                label="Employer / income source"
                value={employer}
                onChange={(e) => setEmployer(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
              <Input
                label="Emergency contact name"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
              />
              <Input
                label="Emergency contact phone"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                type="tel"
              />
              <Input
                label="Desired move-in date"
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <Textarea
              label="Message to property manager (optional)"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the property manager a bit about yourself…"
            />

            {/* Document upload */}
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-900">
                Supporting documents
                <span className="ml-1 font-normal text-neutral-500 text-xs">
                  (paystubs, ID, bank statements, etc.)
                </span>
              </label>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadedDocs.length >= 10}
                className="flex items-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 px-4 py-2.5 text-sm text-neutral-500 hover:border-orange-300 hover:text-orange-500 transition disabled:opacity-50"
              >
                {uploadingCount > 0 ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading {uploadingCount} file{uploadingCount !== 1 ? "s" : ""}…
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4" />
                    Upload documents (PDF, images, Word)
                  </>
                )}
              </button>

              {uploadedDocs.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {uploadedDocs.map((url, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 truncate text-orange-600 hover:underline"
                      >
                        Document {i + 1}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeDoc(i)}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-2 text-[10px] text-neutral-400">
                Your documents are stored securely. ResiGrid never sells or shares your personal
                information with third parties.
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={submitting || uploadingCount > 0}
            >
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          </div>
        )}

        {/* Approved notice */}
        {application.status === "approved" && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Approved! Your property manager will send your lease agreement shortly.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
