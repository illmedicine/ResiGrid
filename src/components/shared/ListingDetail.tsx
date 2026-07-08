"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, doc, getDoc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import {
  Bath,
  BedDouble,
  CalendarCheck,
  ChevronLeft,
  ExternalLink,
  FileUp,
  Heart,
  Loader2,
  MapPin,
  Star,
  Trash2,
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { db, functions, storage } from "@/lib/firebase/config";
import {
  applicationsCol,
  messageThreadsCol,
  tenantInterestsCol,
  threadMessagesCol,
} from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SquareCardField } from "@/components/tenant/SquareCardField";
import { EXTERNAL_METHODS, EXTERNAL_METHOD_KEYS } from "@/lib/payments/externalMethods";
import type { SquareCard } from "@/lib/square/client";
import type {
  ApplicationDoc,
  ApplicationFormDoc,
  ExternalPayMethod,
  ListingDoc,
  PaymentMethodsConfig,
  PropertyManagerDoc,
  TenantInterestDoc,
} from "@/lib/types/models";

export function ListingDetail({ listingId }: { listingId: string }) {
  const { user, userDoc } = useAuth();
  const [listing, setListing] = useState<ListingDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [myApplication, setMyApplication] = useState<ApplicationDoc | null>(null);
  const [myInterest, setMyInterest] = useState<TenantInterestDoc | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interestMessage, setInterestMessage] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitNote, setVisitNote] = useState("");
  const [activePhoto, setActivePhoto] = useState(0);

  // Application form state
  const [applyMode, setApplyMode] = useState(false);
  const [appForm, setAppForm] = useState<ApplicationFormDoc | null>(null);
  const [appFormLoading, setAppFormLoading] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [employer, setEmployer] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [appMessage, setAppMessage] = useState("");
  const [references, setReferences] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [feeCard, setFeeCard] = useState<SquareCard | null>(null);
  const [pmMethods, setPmMethods] = useState<PaymentMethodsConfig | null>(null);
  const [feeMethodChosen, setFeeMethodChosen] = useState<ExternalPayMethod | null>(null);
  const [feeSentAck, setFeeSentAck] = useState(false);
  const [pendingAppId] = useState(() => doc(applicationsCol()).id);
  const fileRef = useRef<HTMLInputElement>(null);

  const isTenant = userDoc?.role === "tenant";

  // Which of the PM's direct-pay apps can cover an application fee. When the PM
  // has any app handle, applicants pay it there and report it (the PM confirms
  // receipt from the application); otherwise the fee is charged by card via Square.
  const feeExternalKeys = pmMethods
    ? EXTERNAL_METHOD_KEYS.filter((key) => Boolean(pmMethods[key]))
    : [];
  const feeUsesExternal = feeExternalKeys.length > 0;

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "listings", listingId), (snap) => {
      setListing(snap.exists() ? ({ ...snap.data(), id: snap.id } as ListingDoc) : null);
      setLoading(false);
    });
    return unsub;
  }, [listingId]);

  // Watch tenant's own application for this listing
  useEffect(() => {
    if (!user || !isTenant) return;
    const q = query(
      applicationsCol(),
      where("tenantId", "==", user.uid),
      where("listingId", "==", listingId),
    );
    const unsub = onSnapshot(q, (snap) => {
      const apps = snap.docs.map((d) => d.data());
      setMyApplication(apps[0] ?? null);
    });
    return unsub;
  }, [user, isTenant, listingId]);

  // Watch tenant's own interest doc for this listing
  useEffect(() => {
    if (!user || !isTenant) return;
    const q = query(
      tenantInterestsCol(),
      where("tenantId", "==", user.uid),
      where("listingId", "==", listingId),
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => d.data());
      setMyInterest(docs[0] ?? null);
    });
    return unsub;
  }, [user, isTenant, listingId]);

  // Load the PM's application form when entering apply mode
  useEffect(() => {
    if (!applyMode || !listing?.applicationFormId) return;
    setAppFormLoading(true);
    getDoc(doc(db, "applicationForms", listing.applicationFormId)).then((snap) => {
      setAppForm(snap.exists() ? (snap.data() as ApplicationFormDoc) : null);
      setAppFormLoading(false);
    }).catch(() => setAppFormLoading(false));
  }, [applyMode, listing?.applicationFormId]);

  // Load the PM's direct-pay app handles for the application-fee step.
  useEffect(() => {
    if (!applyMode || !listing?.ownerId) return;
    getDoc(doc(db, "propertyManagers", listing.ownerId)).then(
      (snap) => setPmMethods((snap.data() as PropertyManagerDoc | undefined)?.paymentMethods ?? {}),
      () => setPmMethods({}),
    );
  }, [applyMode, listing?.ownerId]);

  async function notifyPM(content: string) {
    if (!user || !listing?.ownerId) return;
    const pmId = listing.ownerId;
    const threadId = [user.uid, pmId].sort().join("_");
    const threadRef = doc(messageThreadsCol(), threadId);
    await setDoc(
      threadRef,
      {
        id: threadId,
        participantIds: [user.uid, pmId],
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

  async function handleExpressInterest() {
    if (!user || !listing || !listing.ownerId) return;
    setWorking(true);
    setError(null);
    try {
      await addDoc(tenantInterestsCol(), {
        id: "",
        tenantId: user.uid,
        listingId: listing.id,
        pmId: listing.ownerId,
        type: "interest",
        ...(interestMessage.trim() ? { message: interestMessage.trim() } : {}),
        createdAt: Date.now(),
        status: "pending",
      } as Omit<TenantInterestDoc, "id">);
      await notifyPM(
        `👋 I'm interested in "${listing.title}".${
          interestMessage.trim() ? ` ${interestMessage.trim()}` : ""
        }`,
      );
      setInterestMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send interest");
    } finally {
      setWorking(false);
    }
  }

  async function handleScheduleVisit() {
    if (!user || !listing || !listing.ownerId || !visitDate) return;
    setWorking(true);
    setError(null);
    try {
      await addDoc(tenantInterestsCol(), {
        id: "",
        tenantId: user.uid,
        listingId: listing.id,
        pmId: listing.ownerId,
        type: "visit",
        ...(visitNote.trim() ? { message: visitNote.trim() } : {}),
        preferredDate: new Date(visitDate).getTime(),
        createdAt: Date.now(),
        status: "pending",
      } as Omit<TenantInterestDoc, "id">);
      await notifyPM(
        `📅 I'd like to schedule a visit for "${listing.title}" on ${new Date(
          visitDate,
        ).toLocaleDateString()}.${visitNote.trim() ? ` ${visitNote.trim()}` : ""}`,
      );
      setVisitDate("");
      setVisitNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule visit");
    } finally {
      setWorking(false);
    }
  }

  async function handleFileUpload(files: FileList) {
    if (!user) return;
    const accepted = Array.from(files).slice(0, 10 - uploadedDocs.length);
    if (!accepted.length) return;
    setUploadingCount((c) => c + accepted.length);
    const newUrls: string[] = [];
    for (const file of accepted) {
      const path = `resigrid/applications/${user.uid}/${pendingAppId}/${Date.now()}-${file.name}`;
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

  async function handleSubmitApplication() {
    if (!user || !listing) return;
    setWorking(true);
    setError(null);
    try {
      // Settle the application fee (when the form requires one). Card fees must
      // clear before the application is recorded; app-reported fees submit right
      // away and are marked pending until the PM confirms receipt.
      const feeAmount = appForm?.applicationFee ?? 0;
      const feePolicy = appForm?.feePolicy ?? "non_refundable";
      const feeDue = feeAmount > 0 && feePolicy !== "waived";
      const useExternalFee = feeDue && feeUsesExternal;
      let feePaymentRef: string | undefined;
      let feeStatus: "paid" | "pending" | undefined;

      if (feeDue) {
        if (useExternalFee) {
          if (!feeMethodChosen || !feeSentAck) {
            setError("Choose how you paid the application fee and confirm you sent it.");
            setWorking(false);
            return;
          }
          feeStatus = "pending";
        } else {
          if (!feeCard) {
            setError("Enter your card details to pay the application fee.");
            setWorking(false);
            return;
          }
          const tokenResult = await feeCard.tokenize();
          if (tokenResult.status !== "OK" || !tokenResult.token) {
            throw new Error(tokenResult.errors?.[0]?.message ?? "Card was declined");
          }
          const createVoucher = httpsCallable<object, { voucherId: string }>(functions, "createVoucher");
          const res = await createVoucher({
            amount: feeAmount,
            pmId: listing.ownerId,
            sourceId: tokenResult.token,
          });
          feePaymentRef = res.data.voucherId;
          feeStatus = "paid";
        }
      }

      const appRef = doc(db, "applications", pendingAppId);
      await setDoc(appRef, {
        id: pendingAppId,
        tenantId: user.uid,
        listingId: listing.id,
        unitId: listing.unitId,
        pmId: listing.ownerId,
        status: "submitted",
        submittedAt: Date.now(),
        ...(listing.applicationFormId && { applicationFormId: listing.applicationFormId }),
        ...(monthlyIncome && { monthlyIncome: Number(monthlyIncome) }),
        ...(employer && { employer }),
        ...(emergencyName && { emergencyContactName: emergencyName }),
        ...(emergencyPhone && { emergencyContactPhone: emergencyPhone }),
        ...(moveInDate && { moveInDate: new Date(moveInDate).getTime() }),
        ...(appMessage && { message: appMessage }),
        ...(references && { references }),
        ...(uploadedDocs.length > 0 && { documentUrls: uploadedDocs }),
        ...(Object.keys(customAnswers).length > 0 && { customAnswers }),
        ...(feeAmount > 0 && {
          feeAmount,
          feePolicy,
          feeStatus: feeDue ? feeStatus! : "waived",
          ...(feePaymentRef && { feePaymentRef }),
          ...(useExternalFee && feeMethodChosen && { feeMethod: feeMethodChosen }),
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>;
  if (!listing) return <p className="text-sm text-neutral-600">Listing not found.</p>;

  const bedsLabel = listing.beds === 0 ? "Studio" : `${listing.beds} bed`;
  const isInvited = myApplication?.status === "invited";
  const hasSubmitted = myApplication && !["invited", "shortlisted"].includes(myApplication.status);

  // Document requirement labels for the upload section
  const docRequirements = appForm ? [
    appForm.requirePaystubs && "Paystubs",
    appForm.requireBankStatements && "Bank statements",
    appForm.requirePhotoID && "Photo ID",
    appForm.requireUtilityStatement && "Utility statement",
  ].filter(Boolean) as string[] : [];

  return (
    <div className="flex flex-col gap-5">
      {/* Photo gallery */}
      {listing.photos.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={listing.photos[activePhoto]}
              alt={listing.title}
              className="h-72 w-full object-cover"
            />
          </div>
          {listing.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {listing.photos.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActivePhoto(i)}
                  className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    activePhoto === i ? "border-orange-500" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt={`Photo ${i + 1}`} className="h-16 w-16 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {listing.photos.length === 0 && (
        <div className="flex h-48 items-center justify-center rounded-xl bg-neutral-100 text-sm text-neutral-400">
          No photos available
        </div>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-navy-900">{listing.title}</h1>
          <p className="flex items-center gap-1 text-sm text-neutral-600">
            <MapPin className="h-4 w-4" />
            {listing.city}, {listing.state} {listing.zip}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {listing.featured && (
            <Badge tone="orange">
              <Star className="h-3 w-3 inline mr-0.5" />Featured
            </Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-600">
        <span className="flex items-center gap-1.5">
          <BedDouble className="h-4 w-4" /> {bedsLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <Bath className="h-4 w-4" /> {listing.baths} bath
        </span>
        <span className="text-xl font-bold text-navy-900">
          ${listing.rent.toLocaleString()}/mo
        </span>
        {listing.availableFrom && (
          <span className="text-xs text-neutral-500">
            Available {new Date(listing.availableFrom).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Amenities */}
      {listing.amenities && listing.amenities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {listing.amenities.map((a) => (
            <span
              key={a}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-600"
            >
              {a}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      <Card className="p-5">
        <CardContent className="p-0">
          <p className="text-sm leading-relaxed text-neutral-600">{listing.description}</p>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* CTAs */}
      {!user ? (
        <Card className="p-5 border-orange-100 bg-orange-50">
          <CardContent className="flex flex-col gap-3 p-0">
            <p className="text-sm font-semibold text-navy-900">Interested in this listing?</p>
            <p className="text-xs text-neutral-600">
              Sign in or create a free tenant account to express interest, schedule a viewing, or apply.
            </p>
            <div className="flex gap-2">
              <Button href="/login?role=tenant" size="sm">Sign in / Sign up</Button>
            </div>
          </CardContent>
        </Card>
      ) : userDoc?.role !== "tenant" ? (
        <p className="text-sm text-neutral-500">
          Switch to a tenant account to interact with this listing.
        </p>
      ) : hasSubmitted ? (
        /* Tenant already submitted a real application */
        <Card className="border-green-200 bg-green-50 p-5">
          <CardContent className="p-0 flex flex-col gap-2">
            <p className="text-sm font-semibold text-green-800">
              Application submitted!
            </p>
            <p className="text-xs text-green-700">
              Status: <strong className="capitalize">{myApplication.status.replace(/_/g, " ")}</strong>.
              You&apos;ll be notified of any updates in your messages and applications tab.
            </p>
            <Button href="/tenant/applications" size="sm" variant="outline" className="w-fit mt-1">
              View my applications
            </Button>
          </CardContent>
        </Card>
      ) : isInvited ? (
        /* PM has invited tenant to apply */
        <Card className="border-orange-200 bg-orange-50 p-5">
          <CardContent className="flex flex-col gap-3 p-0">
            <p className="text-sm font-semibold text-navy-900">
              🎉 You&apos;ve been invited to apply!
            </p>
            <p className="text-xs text-neutral-600">
              The property manager has reviewed your interest and invited you to submit a formal
              application. Complete your application to move forward.
            </p>
            <Button href="/tenant/applications" size="sm">
              Complete my application
            </Button>
          </CardContent>
        </Card>
      ) : myInterest ? (
        /* Tenant already expressed interest */
        <Card className="border-neutral-200 bg-neutral-50 p-5">
          <CardContent className="flex flex-col gap-2 p-0">
            <p className="text-sm font-semibold text-navy-900">
              {myInterest.type === "visit" ? "✓ Visit request sent" : "✓ Interest registered"}
            </p>
            <p className="text-xs text-neutral-600">
              The property manager has been notified. If shortlisted, you&apos;ll receive an invitation
              to apply via your messages.
            </p>
            <Button href="/tenant/messages" size="sm" variant="outline" className="w-fit">
              Check messages
            </Button>
          </CardContent>
        </Card>
      ) : applyMode ? (
        /* Inline application form */
        <Card className="p-5">
          <CardContent className="flex flex-col gap-4 p-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setApplyMode(false)}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-sm font-semibold text-navy-900">
                Application — {listing.title}
              </h2>
            </div>

            {appFormLoading ? (
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading form…
              </div>
            ) : (
              <>
                {appForm?.requiredMonthlyIncome ? (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                    This application requires a minimum monthly income of{" "}
                    <strong>${appForm.requiredMonthlyIncome.toLocaleString()}</strong>.
                  </div>
                ) : null}

                {/* Standard fields */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label={
                      appForm?.requiredMonthlyIncome
                        ? `Monthly income ($) — min $${appForm.requiredMonthlyIncome.toLocaleString()}`
                        : "Monthly income ($)"
                    }
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

                {appForm?.requireReferences && (
                  <Textarea
                    label="References (required)"
                    rows={3}
                    value={references}
                    onChange={(e) => setReferences(e.target.value)}
                    placeholder="Name, relationship, and phone/email for each reference — previous landlords carry the most weight…"
                  />
                )}

                <Textarea
                  label="Message to property manager (optional)"
                  rows={3}
                  value={appMessage}
                  onChange={(e) => setAppMessage(e.target.value)}
                  placeholder="Tell the property manager a bit about yourself…"
                />

                {/* Custom questions */}
                {appForm && appForm.customQuestions.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-medium text-navy-900">Additional questions</p>
                    {appForm.customQuestions.map((q, i) => (
                      <Textarea
                        key={i}
                        label={q}
                        rows={2}
                        value={customAnswers[q] ?? ""}
                        onChange={(e) =>
                          setCustomAnswers((prev) => ({ ...prev, [q]: e.target.value }))
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Document uploads */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">
                    Supporting documents
                    {docRequirements.length > 0 && (
                      <span className="ml-1 font-normal text-neutral-500 text-xs">
                        (required: {docRequirements.join(", ")})
                      </span>
                    )}
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
                    Your documents are stored securely. ResiGrid never sells or shares your personal
                    information with third parties.
                  </p>
                </div>

                {/* Application fee */}
                {appForm?.applicationFee ? (
                  appForm.feePolicy === "waived" ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-800">
                      🎉 The ${appForm.applicationFee} application fee is currently{" "}
                      <strong>waived</strong> — submitting is free.
                    </div>
                  ) : feeUsesExternal ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-navy-900">
                          Application fee: ${appForm.applicationFee}
                        </p>
                        <p className="text-xs text-neutral-600">
                          {appForm.feePolicy === "refundable"
                            ? "Refundable if your application is not approved."
                            : "Non-refundable."}{" "}
                          Send it to the property manager through one of their apps below, then
                          confirm you sent it. Your application is submitted right away; they mark
                          the fee received once it arrives.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {feeExternalKeys.map((key) => {
                          const meta = EXTERNAL_METHODS[key];
                          const handle = pmMethods![key]!;
                          const link = meta.payUrl?.(handle, appForm.applicationFee);
                          const chosen = feeMethodChosen === key;
                          return (
                            <div
                              key={key}
                              className={`rounded-lg border bg-white p-2.5 ${chosen ? "border-orange-400" : "border-neutral-200"}`}
                            >
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <span
                                  className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                                  style={{ backgroundColor: meta.color }}
                                >
                                  {meta.label}
                                </span>
                                <span className="font-mono text-xs text-navy-900">
                                  {meta.handlePrefix}
                                  {handle}
                                </span>
                                <div className="ml-auto flex items-center gap-2">
                                  {link ? (
                                    <a
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800"
                                    >
                                      Pay ${appForm.applicationFee}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ) : (
                                    <span className="text-[11px] text-neutral-500">
                                      {meta.tenantInstructions?.(handle)}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFeeMethodChosen(chosen ? null : key);
                                      setFeeSentAck(false);
                                    }}
                                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${chosen ? "border-orange-400 bg-orange-100 text-orange-700" : "border-orange-300 text-orange-600 hover:bg-orange-100"}`}
                                  >
                                    {chosen ? "Selected ✓" : "I'll use this"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {feeMethodChosen && (
                        <label className="flex items-start gap-2 text-xs text-navy-900">
                          <input
                            type="checkbox"
                            checked={feeSentAck}
                            onChange={(e) => setFeeSentAck(e.target.checked)}
                            className="mt-0.5 h-4 w-4 accent-orange-500"
                          />
                          <span>
                            I&apos;ve sent the ${appForm.applicationFee} fee to{" "}
                            {EXTERNAL_METHODS[feeMethodChosen].handlePrefix}
                            {pmMethods![feeMethodChosen]} via {EXTERNAL_METHODS[feeMethodChosen].label}.
                          </span>
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 rounded-xl border border-orange-200 bg-orange-50 p-4">
                      <p className="text-sm font-semibold text-navy-900">
                        Application fee: ${appForm.applicationFee}
                      </p>
                      <p className="text-xs text-neutral-600">
                        {appForm.feePolicy === "refundable"
                          ? "Refundable if your application is not approved."
                          : "Non-refundable."}{" "}
                        Charged when you submit — your application is only sent once payment succeeds.
                      </p>
                      <SquareCardField onReady={setFeeCard} />
                    </div>
                  )
                ) : null}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button
                  onClick={handleSubmitApplication}
                  disabled={
                    working ||
                    uploadingCount > 0 ||
                    (appForm?.requireReferences ? !references.trim() : false) ||
                    Boolean(
                      appForm?.applicationFee &&
                        appForm.feePolicy !== "waived" &&
                        (feeUsesExternal ? !(feeMethodChosen && feeSentAck) : !feeCard),
                    )
                  }
                >
                  {working
                    ? "Submitting…"
                    : appForm?.applicationFee && appForm.feePolicy !== "waived"
                      ? feeUsesExternal
                        ? "Submit application"
                        : `Pay $${appForm.applicationFee} & submit application`
                      : "Submit application"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Main tenant CTAs: apply (if available), express interest, schedule visit */
        <div className="flex flex-col gap-3">
          {listing.applicationFormId && (
            <Card className="border-orange-200 bg-orange-50 p-4">
              <CardContent className="flex items-center justify-between gap-3 p-0 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">
                      This property is accepting applications
                    </p>
                    <p className="text-xs text-neutral-600">
                      Apply now and the property manager will review your RGE Trust Profile
                      and application details.
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => setApplyMode(true)}>
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          )}

          <p className="text-xs font-medium text-navy-900">
            {listing.applicationFormId
              ? "Not ready to apply yet?"
              : "How would you like to proceed?"}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Express Interest */}
            <Card className="flex-1 p-4 cursor-pointer border-neutral-200 hover:border-orange-300 transition">
              <CardContent className="flex flex-col gap-3 p-0">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-orange-500" />
                  <p className="text-sm font-semibold text-navy-900">Express interest</p>
                </div>
                <p className="text-xs text-neutral-500">
                  Let the property manager know you&apos;re interested. They may invite you to apply.
                </p>
                <Textarea
                  placeholder="Add a message (optional)…"
                  rows={2}
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                />
                <Button size="sm" onClick={handleExpressInterest} disabled={working}>
                  <Heart className="h-3.5 w-3.5" />
                  Send interest
                </Button>
              </CardContent>
            </Card>

            {/* Schedule a Visit */}
            <Card className="flex-1 p-4 cursor-pointer border-neutral-200 hover:border-orange-300 transition">
              <CardContent className="flex flex-col gap-3 p-0">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-orange-500" />
                  <p className="text-sm font-semibold text-navy-900">Schedule a visit</p>
                </div>
                <p className="text-xs text-neutral-500">
                  Request a showing. The property manager will confirm a time.
                </p>
                <Input
                  type="date"
                  label="Preferred date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
                <Textarea
                  placeholder="Any notes for the visit? (optional)"
                  rows={2}
                  value={visitNote}
                  onChange={(e) => setVisitNote(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleScheduleVisit}
                  disabled={working || !visitDate}
                >
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Request visit
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-center text-neutral-400">
            {listing.applicationFormId
              ? "You can also just express interest or schedule a visit first — no application required yet."
              : "Applications open after the property manager reviews your interest and sends an invitation."}
          </p>
        </div>
      )}
    </div>
  );
}
