"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { Search, Globe } from "lucide-react";
import { listingsCol, nationalListingsCol } from "@/lib/firebase/firestore";
import { Input } from "@/components/ui/Input";
import { ListingCard } from "@/components/shared/ListingCard";
import { NationalListingCard } from "@/components/shared/NationalListingCard";
import type { ListingDoc, NationalListingDoc } from "@/lib/types/models";

export function ListingSearch() {
  const [resiListings, setResiListings] = useState<ListingDoc[]>([]);
  const [nationalListings, setNationalListings] = useState<NationalListingDoc[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [nationalLoading, setNationalLoading] = useState(true);

  // ResiGrid native listings (published by PMs on the platform)
  useEffect(() => {
    const q = query(listingsCol(), where("status", "==", "published"));
    return onSnapshot(
      q,
      (snap) => {
        setResiListings(snap.docs.map((d) => ({ ...d.data(), id: d.id } as ListingDoc)));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  // National listings cached from RentCast (publicly readable, no auth required)
  useEffect(() => {
    const q = query(nationalListingsCol(), orderBy("syncedAt", "desc"), limit(200));
    return onSnapshot(
      q,
      (snap) => {
        setNationalListings(snap.docs.map((d) => ({ ...d.data(), id: d.id } as NationalListingDoc)));
        setNationalLoading(false);
      },
      () => setNationalLoading(false),
    );
  }, []);

  const { resiResults, nationalResults } = useMemo(() => {
    const term = search.trim().toLowerCase();

    const resiResults = (
      term
        ? resiListings.filter((l) =>
            [l.title, l.city, l.state, l.zip].join(" ").toLowerCase().includes(term),
          )
        : resiListings
    ).sort((a, b) => Number(b.featured) - Number(a.featured));

    const nationalResults = term
      ? nationalListings.filter((l) =>
          [l.formattedAddress, l.city, l.state, l.zipCode, l.addressLine1]
            .join(" ")
            .toLowerCase()
            .includes(term),
        )
      : nationalListings;

    return { resiResults, nationalResults };
  }, [resiListings, nationalListings, search]);

  const isLoading = loading || nationalLoading;
  const hasResi = resiResults.length > 0;
  const hasNational = nationalResults.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
        <Input
          placeholder="Search by city, neighborhood, or zip…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-600">Loading listings…</p>
      ) : !hasResi && !hasNational ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-neutral-600">No listings found{search ? ` for "${search}"` : ""}.</p>
          {!search && (
            <p className="text-xs text-neutral-400">
              Nationwide listings update every 20 hours. Check back soon, or{" "}
              <a href="/login?role=property_manager" className="text-orange-500 hover:underline">
                list your property
              </a>{" "}
              on ResiGrid.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* ── ResiGrid listings ── */}
          {hasResi && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-navy-900">
                  ResiGrid Properties
                  <span className="ml-1.5 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                    {resiResults.length} live
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-500">Apply directly through the platform</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {resiResults.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} href={`/listings/view/?id=${listing.id}`} />
                ))}
              </div>
            </section>
          )}

          {/* ── Nationwide listings from RentCast ── */}
          {hasNational && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-sky-700" />
                <h2 className="text-sm font-semibold text-navy-900">Nationwide Listings</h2>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                  {nationalResults.length.toLocaleString()} available
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Sourced from a national rental database · Updated every 20 hours · Contact agents directly
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {nationalResults.map((listing) => (
                  <NationalListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          )}

          {/* Attribution */}
          <p className="text-center text-xs text-neutral-500">
            {resiListings.length > 0 ? (
              <span className="font-medium text-orange-500">
                {resiListings.length} live listing{resiListings.length !== 1 ? "s" : ""} from ResiGrid property managers.{" "}
              </span>
            ) : (
              <span>
                Property managers —{" "}
                <a href="/login?role=property_manager" className="font-medium text-orange-500 hover:underline">
                  list your properties
                </a>{" "}
                to reach verified RGE tenants.{" "}
              </span>
            )}
            {hasNational && <span className="text-neutral-400">Nationwide data from RentCast.</span>}
          </p>
        </>
      )}
    </div>
  );
}
