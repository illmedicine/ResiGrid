"use client";

import { useEffect, useState } from "react";
import { deleteDoc, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { ArrowRight, Building2, Edit2, Eye, Plus, Trash2 } from "lucide-react";
import { listingsCol } from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { useEffectivePMId } from "@/lib/hooks/useEffectivePMId";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ListingDoc } from "@/lib/types/models";

const STATUS_TONE: Record<ListingDoc["status"], "success" | "neutral" | "warning"> = {
  published: "success",
  draft: "warning",
  filled: "neutral",
  archived: "neutral",
};

export default function PmListingsPage() {
  const { user } = useAuth();
  const { effectiveId } = useEffectivePMId();
  const [listings, setListings] = useState<ListingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!effectiveId) return;
    const q = query(listingsCol(), where("ownerId", "==", effectiveId));
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
  }, [effectiveId]);

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

  const activeListings = listings.filter((l) => l.status === "published" || l.status === "draft");
  const archivedListings = listings.filter((l) => l.status === "archived" || l.status === "filled");

  return (
    <div className="flex flex-col gap-5 max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Listings</h1>
          <p className="text-sm text-neutral-600">
            Manage your active listings. To post a new listing, go to a property and publish from a vacant unit.
          </p>
        </div>
        <Button size="sm" href="/pm/properties">
          <Plus className="h-4 w-4" />
          New listing
        </Button>
      </div>

      {/* How-to hint — only when no listings yet */}
      {!loading && listings.length === 0 && (
        <Card className="border-orange-200 bg-orange-50 p-5">
          <CardContent className="flex flex-col gap-3 p-0">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-orange-100 p-2.5 text-orange-600">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-navy-900">No listings yet</p>
                <p className="text-xs text-neutral-600">
                  Go to a property, open a vacant unit, and click{" "}
                  <strong>Publish listing</strong> to get started.
                </p>
              </div>
            </div>
            <Button size="sm" href="/pm/properties" className="self-start">
              Go to Properties
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-sm text-neutral-600">Loading…</p>}

      {/* Active listings */}
      {activeListings.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Active · {activeListings.length}
          </h2>
          {activeListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              confirmDeleteId={confirmDeleteId}
              deletingId={deletingId}
              onToggleStatus={toggleStatus}
              onConfirmDelete={setConfirmDeleteId}
              onDelete={handleDelete}
            />
          ))}
        </section>
      )}

      {/* Archived listings */}
      {archivedListings.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Archived / Filled · {archivedListings.length}
          </h2>
          {archivedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              confirmDeleteId={confirmDeleteId}
              deletingId={deletingId}
              onToggleStatus={toggleStatus}
              onConfirmDelete={setConfirmDeleteId}
              onDelete={handleDelete}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  confirmDeleteId,
  deletingId,
  onToggleStatus,
  onConfirmDelete,
  onDelete,
}: {
  listing: ListingDoc;
  confirmDeleteId: string | null;
  deletingId: string | null;
  onToggleStatus: (l: ListingDoc) => void;
  onConfirmDelete: (id: string | null) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        {/* Top row: info + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy-900">{listing.title}</p>
            <p className="mt-0.5 text-xs text-neutral-600">
              ${listing.rent.toLocaleString()}/mo &middot; {listing.beds}bd &middot; {listing.baths}ba
              &middot; {listing.city}, {listing.state}
            </p>
            <p className="text-[11px] text-neutral-400">
              Posted {new Date(listing.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge tone={STATUS_TONE[listing.status]}>{listing.status}</Badge>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-2">
          <Button size="sm" variant="outline" href={`/pm/listings/edit?id=${listing.id}`}>
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button size="sm" variant="outline" href={`/listings/view/?id=${listing.id}`}>
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <Button size="sm" variant="outline" onClick={() => onToggleStatus(listing)}>
            {listing.status === "published" ? "Unpublish" : "Republish"}
          </Button>

          <div className="ml-auto flex items-center gap-1">
            {confirmDeleteId === listing.id ? (
              <>
                <span className="text-xs text-red-600">Delete listing?</span>
                <button
                  type="button"
                  onClick={() => onDelete(listing.id)}
                  disabled={deletingId === listing.id}
                  className="rounded bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingId === listing.id ? "…" : "Yes"}
                </button>
                <button
                  type="button"
                  onClick={() => onConfirmDelete(null)}
                  className="rounded border border-neutral-300 px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  No
                </button>
              </>
            ) : (
              <button
                type="button"
                title="Delete listing"
                onClick={() => onConfirmDelete(listing.id)}
                className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
