"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { listingsCol } from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ListingDoc } from "@/lib/types/models";

export default function PmListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(listingsCol(), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setListings(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [user]);

  async function toggleStatus(listing: ListingDoc) {
    const next = listing.status === "published" ? "archived" : "published";
    await updateDoc(doc(db, "listings", listing.id), { status: next });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Listings</h1>
        <p className="text-sm text-neutral-600">
          Listings published from your vacant units.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : listings.length === 0 ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">
              No listings yet. Publish a listing from a vacant unit on the
              Properties page.
            </p>
          </CardContent>
        </Card>
      ) : (
        listings.map((listing) => (
          <Card key={listing.id} className="p-4">
            <CardContent className="flex items-center justify-between p-0">
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  {listing.title}
                </p>
                <p className="text-xs text-neutral-600">
                  ${listing.rent.toLocaleString()}/mo · {listing.city},{" "}
                  {listing.state}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={listing.status === "published" ? "success" : "neutral"}>
                  {listing.status}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => toggleStatus(listing)}>
                  {listing.status === "published" ? "Unpublish" : "Republish"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
