"use client";

import { useState } from "react";
import { BedDouble, Bath, MapPin, Building2, Globe, Phone, Mail, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import type { NationalListingDoc } from "@/lib/types/models";

export function NationalListingCard({ listing }: { listing: NationalListingDoc }) {
  const [expanded, setExpanded] = useState(false);
  const photo = listing.photos[0] ?? null;
  const bedsLabel = listing.beds === 0 ? "Studio" : `${listing.beds} bd`;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
      {/* Photo */}
      <div className="relative h-44 overflow-hidden bg-neutral-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={listing.formattedAddress}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="h-10 w-10 text-neutral-300" />
          </div>
        )}

        {/* Nationwide badge */}
        <div className="absolute left-2 top-2">
          <span className="flex items-center gap-0.5 rounded-full bg-sky-700/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            <Globe className="h-2.5 w-2.5" /> Nationwide
          </span>
        </div>

        {/* Rent pill */}
        <div className="absolute bottom-2 right-2 rounded-full bg-navy-900/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
          ${listing.rent.toLocaleString()}/mo
        </div>
      </div>

      <CardContent className="flex flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 text-sm font-bold text-navy-900">
          {listing.addressLine1 || listing.formattedAddress}
        </h3>
        <p className="flex items-center gap-1 text-xs text-neutral-600">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {listing.city}, {listing.state} {listing.zipCode}
        </p>
        <div className="flex items-center gap-3 text-xs text-neutral-600">
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" /> {bedsLabel}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" /> {listing.baths} ba
          </span>
          {listing.sqft && (
            <span className="text-neutral-500">{listing.sqft.toLocaleString()} sqft</span>
          )}
        </div>

        {listing.propertyType && (
          <p className="text-[10px] text-neutral-400">{listing.propertyType}</p>
        )}

        {/* Expand/collapse contact info */}
        {(listing.agentName || listing.agentEmail || listing.agentPhone || listing.listingUrl) && (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 flex items-center gap-1 text-[11px] font-medium text-sky-700 hover:text-sky-900"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" /> Hide contact</>
              ) : (
                <><ChevronDown className="h-3 w-3" /> Contact info</>
              )}
            </button>

            {expanded && (
              <div className="mt-1 flex flex-col gap-1 rounded-lg bg-sky-50 p-2.5 text-[11px] text-neutral-700">
                {listing.agentName && (
                  <p className="font-semibold">{listing.agentName}</p>
                )}
                {listing.agentPhone && (
                  <a
                    href={`tel:${listing.agentPhone}`}
                    className="flex items-center gap-1 text-sky-700 hover:underline"
                  >
                    <Phone className="h-3 w-3" /> {listing.agentPhone}
                  </a>
                )}
                {listing.agentEmail && (
                  <a
                    href={`mailto:${listing.agentEmail}`}
                    className="flex items-center gap-1 text-sky-700 hover:underline"
                  >
                    <Mail className="h-3 w-3" /> {listing.agentEmail}
                  </a>
                )}
                {listing.listingUrl && (
                  <a
                    href={listing.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sky-700 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> View full listing
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
