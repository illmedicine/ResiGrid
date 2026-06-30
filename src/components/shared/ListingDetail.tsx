"use client";

import { useEffect, useState } from "react";
import { addDoc, doc, onSnapshot } from "firebase/firestore";
import { BedDouble, Bath, MapPin } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { applicationsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "listings", listingId), (snap) => {
      setListing(snap.exists() ? (snap.data() as ListingDoc) : null);
      setLoading(false);
    });
    return unsub;
  }, [listingId]);

  async function handleApply() {
    if (!user || !listing) return;
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

  return (
    <div className="flex flex-col gap-5">
      <div className="h-64 overflow-hidden rounded-xl bg-neutral-100">
        {listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-600">
            No photo available
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-900">{listing.title}</h1>
          <p className="flex items-center gap-1 text-sm text-neutral-600">
            <MapPin className="h-4 w-4" />
            {listing.city}, {listing.state} {listing.zip}
          </p>
        </div>
        {listing.featured && <Badge tone="orange">Featured on ResiGrid</Badge>}
      </div>

      <div className="flex items-center gap-4 text-sm text-neutral-600">
        <span className="flex items-center gap-1">
          <BedDouble className="h-4 w-4" /> {listing.beds} bed
        </span>
        <span className="flex items-center gap-1">
          <Bath className="h-4 w-4" /> {listing.baths} bath
        </span>
        <span className="text-lg font-bold text-navy-900">
          ${listing.rent.toLocaleString()}/mo
        </span>
      </div>

      <Card className="p-5">
        <CardContent className="p-0">
          <p className="text-sm text-neutral-600">{listing.description}</p>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!user ? (
        <Button href="/login">Log in to apply</Button>
      ) : userDoc?.role !== "tenant" ? (
        <p className="text-sm text-neutral-600">
          Sign in with a tenant account to apply for this listing.
        </p>
      ) : applied ? (
        <Badge tone="success" className="w-fit px-3 py-1.5">
          Application submitted
        </Badge>
      ) : (
        <Button onClick={handleApply} disabled={applying}>
          {applying ? "Submitting…" : "Apply now"}
        </Button>
      )}
    </div>
  );
}
