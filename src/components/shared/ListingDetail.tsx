"use client";

import { useEffect, useState } from "react";
import { addDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { Bath, BedDouble, CalendarCheck, Heart, MapPin, Star } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { applicationsCol, tenantInterestsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { DEMO_LISTINGS } from "@/lib/listings/demoListings";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import type { ApplicationDoc, ListingDoc, TenantInterestDoc } from "@/lib/types/models";

export function ListingDetail({ listingId }: { listingId: string }) {
  const { user, userDoc } = useAuth();
  const [listing, setListing] = useState<ListingDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [myApplication, setMyApplication] = useState<ApplicationDoc | null>(null);
  const [myInterest, setMyInterest] = useState<TenantInterestDoc | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visitMode, setVisitMode] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitNote, setVisitNote] = useState("");
  const [activePhoto, setActivePhoto] = useState(0);

  const isDemo = listingId.startsWith("demo-");
  const isTenant = userDoc?.role === "tenant";

  useEffect(() => {
    if (isDemo) {
      const found = DEMO_LISTINGS.find((l) => l.id === listingId);
      setListing(found ?? null);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, "listings", listingId), (snap) => {
      setListing(snap.exists() ? ({ ...snap.data(), id: snap.id } as ListingDoc) : null);
      setLoading(false);
    });
    return unsub;
  }, [listingId, isDemo]);

  // Watch tenant's own application for this listing
  useEffect(() => {
    if (!user || !isTenant || isDemo) return;
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
  }, [user, isTenant, listingId, isDemo]);

  // Watch tenant's own interest doc for this listing
  useEffect(() => {
    if (!user || !isTenant || isDemo) return;
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
  }, [user, isTenant, listingId, isDemo]);

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
        message: interestMessage.trim() || undefined,
        createdAt: Date.now(),
        status: "pending",
      } as Omit<TenantInterestDoc, "id">);
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
        message: visitNote.trim() || undefined,
        preferredDate: new Date(visitDate).getTime(),
        createdAt: Date.now(),
        status: "pending",
      } as Omit<TenantInterestDoc, "id">);
      setVisitMode(false);
      setVisitDate("");
      setVisitNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule visit");
    } finally {
      setWorking(false);
    }
  }

  async function handleApply() {
    if (!user || !listing) return;
    setWorking(true);
    setError(null);
    try {
      await addDoc(applicationsCol(), {
        id: "",
        tenantId: user.uid,
        listingId: listing.id,
        pmId: listing.ownerId,
        status: "submitted",
        submittedAt: Date.now(),
        ...(listing.applicationFormId ? { applicationFormId: listing.applicationFormId } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>;
  if (!listing) return <p className="text-sm text-neutral-600">Listing not found.</p>;

  const bedsLabel = listing.beds === 0 ? "Studio" : `${listing.beds} bed`;
  const isInvited = myApplication?.status === "invited";
  const hasSubmitted = myApplication && !["invited", "shortlisted"].includes(myApplication.status);

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
          {isDemo && <Badge tone="neutral">Sample listing</Badge>}
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
      {isDemo ? (
        <Card className="border-orange-200 bg-orange-50 p-5">
          <CardContent className="flex flex-col gap-3 p-0">
            <p className="text-sm font-semibold text-navy-900">
              This is a sample listing showing what ResiGrid looks like.
            </p>
            <p className="text-xs text-neutral-600">
              Real listings let you apply with your RGE Trust Profile — no paper applications,
              no fax, no credit bureau pull required.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button href="/login?role=tenant" size="sm">
                Create your RGE profile
              </Button>
              <Button href="/login?role=property_manager" variant="outline" size="sm">
                List your property
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !user ? (
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
      ) : listing.applicationFormId ? (
        /* Listing has an application form — show direct Apply Now CTA */
        <Card className="border-orange-200 bg-orange-50 p-5">
          <CardContent className="flex flex-col gap-3 p-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <p className="text-sm font-semibold text-navy-900">This property is accepting applications</p>
            </div>
            <p className="text-xs text-neutral-600">
              The property manager has set up a screening process. Apply now and they&apos;ll
              review your RGE Trust Profile and application details.
            </p>
            <Button size="sm" onClick={handleApply} disabled={working}>
              {working ? "Submitting…" : "Apply Now"}
            </Button>
            <button
              type="button"
              onClick={() => setVisitMode(true)}
              className="text-xs text-neutral-500 hover:text-orange-600 hover:underline text-left"
            >
              Prefer to visit first? Schedule a showing →
            </button>
            {visitMode && (
              <div className="flex flex-col gap-2 border-t border-orange-200 pt-3">
                <Input
                  type="date"
                  label="Preferred visit date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
                <Button size="sm" variant="outline" onClick={handleScheduleVisit} disabled={working || !visitDate}>
                  <CalendarCheck className="h-3.5 w-3.5" /> Request visit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Main tenant CTAs: express interest or schedule visit */
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-navy-900">
            How would you like to proceed?
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
            Applications open after the property manager reviews your interest and sends an invitation.
          </p>
        </div>
      )}
    </div>
  );
}
