"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot, query, where, collection } from "firebase/firestore";
import { Locate, Loader2, Search, Globe, X } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { listingsCol, unitsCol } from "@/lib/firebase/firestore";
import { SAMPLE_NATIONAL_LISTINGS } from "@/lib/data/sampleNationalListings";
import { Input } from "@/components/ui/Input";
import { ListingCard } from "@/components/shared/ListingCard";
import { NationalListingCard } from "@/components/shared/NationalListingCard";
import type { ListingDoc, UnitDoc } from "@/lib/types/models";

export function ListingSearch() {
  const [resiListings, setResiListings] = useState<ListingDoc[]>([]);
  const [units, setUnits] = useState<Map<string, any>>(new Map());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationCity, setLocationCity] = useState<string | null>(null);

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

  useEffect(() => {
    const unitsQuery = query(collection(db, "units"));
    return onSnapshot(
      unitsQuery,
      (snap) => {
        const unitsMap = new Map();
        snap.docs.forEach((d) => {
          unitsMap.set(d.id, d.data());
        });
        setUnits(unitsMap);
      },
    );
  }, []);

  async function handleLocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "";
          if (city) {
            setSearch(city);
            setLocationCity(city);
          }
        } catch {
          // silently ignore reverse-geocode failures
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
    );
  }

  function clearSearch() {
    setSearch("");
    setLocationCity(null);
  }

  const { resiResults, nationalResults } = useMemo(() => {
    const term = search.trim().toLowerCase();

    const resiResults = (
      term
        ? resiListings.filter((l) =>
            [l.title, l.city, l.state, l.zip].join(" ").toLowerCase().includes(term),
          )
        : resiListings
    )
      .filter((l) => {
        const unit = units.get(l.unitId);
        return unit && unit.status === "vacant";
      })
      .sort((a, b) => Number(b.featured) - Number(a.featured));

    const nationalResults = term
      ? SAMPLE_NATIONAL_LISTINGS.filter((l) =>
          [l.formattedAddress, l.city, l.state, l.zipCode, l.addressLine1]
            .join(" ")
            .toLowerCase()
            .includes(term),
        )
      : SAMPLE_NATIONAL_LISTINGS;

    return { resiResults, nationalResults };
  }, [resiListings, search, units]);

  const hasResi = resiResults.length > 0;
  const hasNational = nationalResults.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Search bar */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
          <Input
            placeholder="Search by city, neighborhood, or zip…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setLocationCity(null); }}
            className="pl-9 pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          title="Find listings near me"
          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:border-orange-300 hover:text-orange-600 transition disabled:opacity-50 shrink-0"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Locate className="h-3.5 w-3.5" />
          )}
          Near me
        </button>
      </div>

      {locationCity && (
        <p className="text-xs text-orange-600 font-medium -mt-3">
          Showing listings near <strong>{locationCity}</strong> —{" "}
          <button type="button" onClick={clearSearch} className="underline hover:no-underline">
            clear
          </button>
        </p>
      )}

      {loading ? (
        <p className="text-sm text-neutral-600">Loading listings…</p>
      ) : !hasResi && !hasNational ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-neutral-600">
            No listings found{search ? ` for "${search}"` : ""}.
          </p>
          <p className="text-xs text-neutral-400">
            Try a different search — we have listings in New York, Los Angeles, Chicago, Atlanta,
            Houston, Buffalo, Miami, Denver, Seattle, and Phoenix.
          </p>
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
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    href={`/listings/view/?id=${listing.id}`}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Nationwide sample listings ── */}
          {hasNational && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-sky-700" />
                <h2 className="text-sm font-semibold text-navy-900">Nationwide Listings</h2>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                  {nationalResults.length} available
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Sample listings across major U.S. markets · Contact agents directly
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {nationalResults.map((listing) => (
                  <NationalListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-neutral-500">
            {resiListings.length > 0 ? (
              <span className="font-medium text-orange-500">
                {resiListings.length} live listing{resiListings.length !== 1 ? "s" : ""} from
                ResiGrid property managers.{" "}
              </span>
            ) : (
              <span>
                Property managers —{" "}
                <a
                  href="/login?role=property_manager"
                  className="font-medium text-orange-500 hover:underline"
                >
                  list your properties
                </a>{" "}
                to reach verified RGE tenants.{" "}
              </span>
            )}
          </p>
        </>
      )}
    </div>
  );
}
