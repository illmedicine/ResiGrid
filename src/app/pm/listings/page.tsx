"use client";

import { useEffect, useState } from "react";
import { deleteDoc, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { Eye, Trash2 } from "lucide-react";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(listingsCol(), where("ownerId", "==", user.uid));
    return onSnapshot(
      q,
      (snap) => {
        const sorted = snap.docs
          .map((d) => d.data())
          .sort((a, b) => b.createdAt - a.createdAt);
        setListings(sorted);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user]);

  async function toggleStatus(listing: ListingDoc) {
    const next = listing.status === "published" ? "archived" : "published";
    await updateDoc(doc(db, "listings", listing.id), { status: next });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "listings", id));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  const STATUS_TONE: Record<ListingDoc["status"], "success" | "neutral" | "warning"> = {
    published: "success",
    draft: "warning",
    filled: "neutral",
    archived: "neutral",
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Listings</h1>
        <p className="text-sm text-neutral-600">
          All listings published from your properties. Each unit can have its own active listing.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : listings.length === 0 ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">
              No listings yet. Go to a property, open a vacant unit, and click{" "}
              <strong>Publish listing</strong>.
            </p>
          </CardContent>
        </Card>
      ) : (
        listings.map((listing) => (
          <Card key={listing.id} className="p-4">
            <CardContent className="p-0 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-900 truncate">{listing.title}</p>
                  <p className="text-xs text-neutral-600">
                    ${listing.rent.toLocaleString()}/mo · {listing.beds}bd / {listing.baths}ba · {listing.city}, {listing.state}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Posted {new Date(listing.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[listing.status]}>{listing.status}</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  href={`/listings/view/?id=${listing.id}`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View listing
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleStatus(listing)}>
                  {listing.status === "published" ? "Unpublish" : "Republish"}
                </Button>
                <Button
                  size="sm"
                  href={`/pm/listings/new?unitId=${listing.unitId}&propertyId=${listing.propertyId}`}
                  variant="outline"
                >
                  Post new listing
                </Button>

                <div className="ml-auto flex items-center gap-1">
                  {confirmDeleteId === listing.id ? (
                    <>
                      <span className="text-xs text-red-600">Delete listing?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(listing.id)}
                        disabled={deletingId === listing.id}
                        className="rounded bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === listing.id ? "…" : "Yes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded border border-neutral-300 px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-50"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      title="Delete listing"
                      onClick={() => setConfirmDeleteId(listing.id)}
                      className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
