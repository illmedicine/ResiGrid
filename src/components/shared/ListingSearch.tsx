"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { Search } from "lucide-react";
import { listingsCol } from "@/lib/firebase/firestore";
import { DEMO_LISTINGS, filterDemoListings } from "@/lib/listings/demoListings";
import { Input } from "@/components/ui/Input";
import { ListingCard } from "@/components/shared/ListingCard";
import type { ListingDoc } from "@/lib/types/models";

export function ListingSearch() {
  const [resiListings, setResiListings] = useState<ListingDoc[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Load real Firestore listings (from actual ResiGrid property managers)
  useEffect(() => {
    const q = query(listingsCol(), where("status", "==", "published"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setResiListings(snap.docs.map((d) => ({ ...d.data(), id: d.id } as ListingDoc)));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const allListings = useMemo(() => {
    const term = search.trim().toLowerCase();

    // Real listings: text-filter + featured first
    const filteredResi = (
      term
        ? resiListings.filter((l) =>
            [l.title, l.city, l.state, l.zip].join(" ").toLowerCase().includes(term),
          )
        : resiListings
    ).sort((a, b) => Number(b.featured) - Number(a.featured));

    // Demo listings: filter by search term
    const filteredDemo = filterDemoListings(search);

    // Real listings appear first, demos fill in the rest
    return [...filteredResi, ...filteredDemo];
  }, [resiListings, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
        <Input
          placeholder="Search by city, neighborhood, or zip…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading listings…</p>
      ) : allListings.length === 0 ? (
        <p className="text-sm text-neutral-600">No listings match your search.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                href={`/listings/view/?id=${listing.id}`}
              />
            ))}
          </div>

          {/* Attribution note */}
          <p className="text-center text-xs text-neutral-500">
            Sample listings shown for demonstration.{" "}
            {resiListings.length > 0 ? (
              <span className="font-medium text-orange-500">
                {resiListings.length} live listing{resiListings.length !== 1 ? "s" : ""} from ResiGrid property managers.
              </span>
            ) : (
              <span>
                Property managers —{" "}
                <a href="/login?role=property_manager" className="font-medium text-orange-500 hover:underline">
                  list your properties
                </a>{" "}
                to reach verified RGE tenants.
              </span>
            )}
          </p>
        </>
      )}
    </div>
  );
}
