"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { Building2, Loader2, Search } from "lucide-react";
import { listingsCol } from "@/lib/firebase/firestore";
import { searchHudListings } from "@/lib/hud/api";
import { Input } from "@/components/ui/Input";
import { ListingCard } from "@/components/shared/ListingCard";
import type { ListingDoc } from "@/lib/types/models";

export function ListingSearch() {
  const [resiListings, setResiListings] = useState<ListingDoc[]>([]);
  const [hudListings, setHudListings] = useState<ListingDoc[]>([]);
  const [resiLoading, setResiLoading] = useState(true);
  const [hudLoading, setHudLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Always load ResiGrid-native listings from Firestore
  useEffect(() => {
    const q = query(listingsCol(), where("status", "==", "published"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setResiListings(snap.docs.map((d) => d.data()));
        setResiLoading(false);
      },
      () => setResiLoading(false),
    );
    return unsub;
  }, []);

  // Debounce search then query HUD LIHTC API for city matches
  useEffect(() => {
    const term = search.trim();
    if (term.length < 3) {
      setHudListings([]);
      return;
    }
    setHudLoading(true);

    // Parse "City, ST" or "City" from the search string
    const parts = term.split(",").map((p) => p.trim());
    const city = parts[0];
    const state = parts[1]?.toUpperCase() ?? undefined;

    const timer = setTimeout(async () => {
      const results = await searchHudListings(city, state);
      setHudListings(results);
      setHudLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [search]);

  const allListings = useMemo(() => {
    const term = search.trim().toLowerCase();
    const resi = [...resiListings].sort(
      (a, b) => Number(b.featured) - Number(a.featured),
    );

    // Text-filter the ResiGrid listings when user types
    const filteredResi = term
      ? resi.filter((l) =>
          [l.title, l.city, l.state, l.zip]
            .join(" ")
            .toLowerCase()
            .includes(term),
        )
      : resi;

    // HUD results are already pre-filtered by the API
    return [...filteredResi, ...hudListings];
  }, [resiListings, hudListings, search]);

  const hasHudResults = hudListings.length > 0;
  const loading = resiLoading;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
        <Input
          placeholder='Search by city, state or "City, ST"…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {search.trim().length >= 3 && (
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          {hudLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Building2 className="h-3.5 w-3.5 text-orange-500" />
          )}
          {hudLoading
            ? "Searching HUD community housing database…"
            : hasHudResults
              ? `${hudListings.length} community housing result${hudListings.length > 1 ? "s" : ""} from HUD LIHTC program`
              : "No community housing found for that location — try a different city."}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-600">Loading listings…</p>
      ) : allListings.length === 0 ? (
        <p className="text-sm text-neutral-600">
          No listings found.
          {search.trim().length < 3
            ? " Type a city name (3+ characters) to search community housing."
            : ""}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allListings.map((listing, i) => (
            <ListingCard
              key={listing.id || i}
              listing={listing}
              href={
                listing.source === "hud_lihtc"
                  ? `https://lihtc.huduser.gov/?latitude=${listing.geo?.lat ?? 0}&longitude=${listing.geo?.lng ?? 0}&radius=1`
                  : `/listings/view/?id=${listing.id}`
              }
              external={listing.source === "hud_lihtc"}
            />
          ))}
        </div>
      )}

      {hasHudResults && (
        <p className="text-center text-xs text-neutral-500">
          Community housing data sourced from{" "}
          <a
            href="https://lihtc.huduser.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 hover:underline"
          >
            HUD's LIHTC National Database
          </a>
          . Income limits and availability vary — contact the property directly.
        </p>
      )}
    </div>
  );
}
