"use client";

import { useEffect, useState } from "react";
import { addDoc, doc, onSnapshot } from "firebase/firestore";
import { Bath, BedDouble, MapPin, Star } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { applicationsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { DEMO_LISTINGS } from "@/lib/listings/demoListings";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ListingDoc } from "@/lib/types/models";

export function ListingDetail({ listingId }: { listingId: string }) {
  const { user, userDoc } = useAuth();
  const [listing, setListing] = useState<ListingDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDemo = listingId.startsWith("demo-");

  useEffect(() => {
    if (isDemo) {
      // Demo listing — load from static data, no Firestore needed
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

  async function handleApply() {
    if (!user || !listing || isDemo) return;
    setApplying(true);
    setError(null);
    try {
      await addDoc(applicationsCol(), {
        id: "",
        tenantId: user.uid,
        listingId: listing.id,
        status: "submitted",
        submittedAt: Date.now(),
      });
      setApplied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>;
  if (!listing) return <p className="text-sm text-neutral-600">Listing not found.</p>;

  const bedsLabel = listing.beds === 0 ? "Studio" : `${listing.beds} bed`;

  return (
    <div className="flex flex-col gap-5">
      {/* Photo gallery */}
      {listing.photos.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="sm:row-span-2 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={listing.photos[0]}
              alt={listing.title}
              className="h-full w-full object-cover"
              style={{ minHeight: 240 }}
            />
          </div>
          {listing.photos.slice(1, 3).map((p, i) => (
            <div key={i} className="overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt={`${listing.title} ${i + 2}`} className="h-48 w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* No photo fallback */}
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
          {listing.featured && <Badge tone="orange"><Star className="h-3 w-3 inline mr-0.5" />Featured</Badge>}
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
      </div>

      {/* Description */}
      <Card className="p-5">
        <CardContent className="p-0">
          <p className="text-sm leading-relaxed text-neutral-600">{listing.description}</p>
        </CardContent>
      </Card>

      {/* CTA */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {isDemo ? (
        /* Demo listing — prompt sign up, explain what applying means */
        <Card className="border-orange-200 bg-orange-50 p-5">
          <CardContent className="flex flex-col gap-3 p-0">
            <p className="text-sm font-semibold text-navy-900">
              This is a sample listing showing what ResiGrid listings look like.
            </p>
            <p className="text-xs text-neutral-600">
              Real listings from ResiGrid property managers let you apply instantly
              with your RGE Trust Profile — no resume, no fax, no credit bureau pull.
            </p>
            <div className="flex gap-2">
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
        <Button href="/login?role=tenant">Log in to apply</Button>
      ) : userDoc?.role !== "tenant" ? (
        <p className="text-sm text-neutral-600">
          Sign in with a tenant account to apply for this listing.
        </p>
      ) : applied ? (
        <Badge tone="success" className="w-fit px-3 py-1.5 text-sm">
          ✓ Application submitted — your RGE Score is now visible to the property manager.
        </Badge>
      ) : (
        <Button onClick={handleApply} disabled={applying} size="lg" className="w-full sm:w-auto">
          {applying ? "Submitting…" : "Apply with RGE Profile"}
        </Button>
      )}
    </div>
  );
}
