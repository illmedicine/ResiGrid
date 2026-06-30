"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { Search } from "lucide-react";
import { listingsCol } from "@/lib/firebase/firestore";
import { Input } from "@/components/ui/Input";
import { ListingCard } from "@/components/shared/ListingCard";
import type { ListingDoc } from "@/lib/types/models";

export function ListingSearch() {
  const [listings, setListings] = useState<ListingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(listingsCol(), where("status", "==", "published"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setListings(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sorted = [...listings].sort(
      (a, b) => Number(b.featured) - Number(a.featured),
    );
    if (!term) return sorted;
    return sorted.filter((listing) =>
      [listing.title, listing.city, listing.state, listing.zip]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [listings, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
        <Input
          placeholder="Search by city, state, or zip…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading listings…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-neutral-600">No listings found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              href={`/listings/view/?id=${listing.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
