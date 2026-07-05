"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import {
  ArrowLeft,
  CheckCircle2,
  FileUp,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { ApplicationPreviewDoc } from "@/components/shared/ApplicationPreviewDoc";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { ApplicationDoc, ApplicationFormDoc, ListingDoc } from "@/lib/types/models";

function TenantApplicationViewContent() {
  const { user } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") ?? "";

  const [application, setApplication] = useState<ApplicationDoc | null>(null);
  const [listing, setListing] = useState<ListingDoc | null>(null);
  const [formDoc, setFormDoc] = useState<ApplicationFormDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form fields (for invited / more_info_needed)
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [employer, setEmployer] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [message, setMessage] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    return onSnapshot(
      doc(db, "applications", id),
      (snap) => {
        if (!snap.exists()) { setApplication(null); setLoading(false); return; }
        const data = { ...snap.data(), id: snap.id } as ApplicationDoc;
        setApplication(data);
        setLoading(false);
      },
      () => {
        setApplication(null);
        setForbidden(true);
        setLoading(false);
      },
    );
  }, [id]);

  // Verify ownership + load supporting data
  useEffect(() => {
    if (!application?.id || !user) return;

    if (application.tenantId !== user.uid) {
      setForbidden(true);
      return;
    }

    // Pre-fill form fields from existing application data
    if (application.monthlyIncome) setMonthlyIncome(String(application.monthlyIncome));
    if (application.employer) setEmployer(application.employer);
    if (application.emergencyContactName) setEmergencyName(application.emergencyContactName);
    if (application.emergencyContactPhone) setEmergencyPhone(application.emergencyContactPhone);
    if (application.moveInDate)
      setMoveInDate(new Date(application.moveInDate).toISOString().split("T")[0]);
    if (application.message) setMessage(application.message);
    if (application.customAnswers) setCustomAnswers(application.customAnswers);
    if (application.documentUrls) setUploadedDocs(application.documentUrls);

    // Load listing
    if (application.listingId && !application.listingId.startsWith("demo-")) {
      getDoc(doc(db, "listings", application.listingId)).then((snap) => {
        if (snap.exists()) setListing({ ...snap.data(), id: snap.id } as ListingDoc);
      });
    }

    // Load form doc
    if (application.applicationFormId) {
      getDoc(doc(db, "applicationForms", application.applicationFormId)).then((snap) => {
        if (snap.exists()) setFormDoc({ ...snap.data(), id: snap.id } as ApplicationFormDoc);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.id, user?.uid]);

  async function handleFileUpload(files: FileList) {
    if (!user || !application) return;
    const accepted = Array.from(files).slice(0, 10 - uploadedDocs.length);
    if (!accepted.length) return;
    setUploadingCount((c) => c + accepted.length);
    const newUrls: string[] = [];
    for (const file of accepted) {
      const path = `resigrid/applications/${user.uid}/${application.id}/${Date.now()}-${file.name}`;
      try {
        const ref = storageRef(storage, path);
        await uploadBytes(ref, file);
        const url = await getDownloadURL(ref);
        newUrls.push(url);
      } catch {
        // skip failed uploads silently
      } finally {
        setUploadingCount((c) => c - 1);
      }
    }
    setUploadedDocs((prev) => [...prev, ...newUrls]);
  }

  async function handleSubmit() {
    if (!application) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await updateDoc(doc(db, "applications", application.id), {
        status: "submitted",
        submittedAt: Date.now(),
        decisionNote: null,
        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
        employer: employer || undefined,
        emergencyContactName: emergencyName || undefined,
        emergencyContactPhone: emergencyPhone || undefined,
        moveInDate: moveInDate ? new Date(moveInDate).getTime() : undefined,
        message: message || undefined,
        customAnswers,
        documentUrls: uploadedDocs,
      });
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-neutral-600">Loading…</p>;
  }
  if (forbidden) {
    return <p className="p-6 text-sm text-red-600">You do not have access to this application.</p>;
  }
  if (!application) {
    return <p className="p-6 text-sm text-red-600">Application not found.</p>;
  }

  const needsForm = application.status === "invited" || application.status === "more_info_needed";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col gap-6">
      {/* Nav */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-lg font-bold text-navy-900">My Application</h1>
          {listing && (
            <p className="text-xs text-neutral-500">
              {listing.title} · {listing.city}, {listing.state}
            </p>
          )}
        </div>
      </div>

      {/* Read-only document view */}
      <ApplicationPreviewDoc
        application={application}
        tenantName={user?.displayName ?? user?.email ?? ""}
        tenantEmail={user?.email ?? ""}
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

      {/* Application form (invited or more_info_needed) */}
      {needsForm && !submitSuccess && (
        <Card className="p-5">
          <CardContent className="flex flex-col gap-4 p-0">
            <div>
              <h2 className="text-sm font-semibold text-navy-900">
                {application.status === "more_info_needed"
                  ? "Respond to information request"
                  : "Complete your application"}
              </h2>
              {application.status === "more_info_needed" && application.decisionNote && (
                <div className="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800">
                  <strong>Requested by property manager:</strong> {application.decisionNote}
                </div>
              )}
              {application.status === "invited" && (
                <p className="text-xs text-neutral-500 mt-1">
                  You&apos;ve been invited to apply. Fill in the details below and submit your application.
                </p>
              )}
            </div>

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
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
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

            {/* Custom questions from application form */}
            {formDoc && formDoc.customQuestions.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-navy-900">Additional questions</p>
                {formDoc.customQuestions.map((question) => (
                  <Textarea
                    key={question}
                    label={question}
                    rows={2}
                    value={customAnswers[question] ?? ""}
                    onChange={(e) =>
                      setCustomAnswers((prev) => ({ ...prev, [question]: e.target.value }))
                    }
                  />
                ))}
              </div>
            )}

            {/* Document upload */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
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
                        onClick={() => setUploadedDocs((prev) => prev.filter((_, j) => j !== i))}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-2 text-[10px] text-neutral-400">
                Your documents are stored securely and only shared with the property manager.
              </p>
            </div>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <Button
              onClick={handleSubmit}
              disabled={submitting || uploadingCount > 0}
            >
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {submitSuccess && (
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
      )}

      {/* Approved notice */}
      {application.status === "approved" && (
        <Card className="border-green-200 bg-green-50 p-4">
          <CardContent className="flex items-center gap-2 p-0">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800 font-medium">
              Approved! Your property manager will send your lease agreement shortly.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function TenantApplicationViewPage() {
  return (
    <Suspense>
      <TenantApplicationViewContent />
    </Suspense>
  );
}
