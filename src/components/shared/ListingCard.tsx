import Link from "next/link";
import { BedDouble, Bath, Building2, MapPin, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ListingDoc } from "@/lib/types/models";

export function ListingCard({
  listing,
  href,
}: {
  listing: ListingDoc;
  href: string;
}) {
  const isDemo = (listing as ListingDoc & { source?: string }).source === "demo";
  const isHud  = (listing as ListingDoc & { source?: string }).source === "hud_lihtc";
  const photo  = listing.photos[0] ?? null;

  const bedsLabel = listing.beds === 0 ? "Studio" : `${listing.beds} bd`;

  return (
    <Link href={href}>
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
        {/* Photo */}
        <div className="relative h-44 overflow-hidden bg-neutral-100">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="h-10 w-10 text-neutral-300" />
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {listing.featured && (
              <span className="flex items-center gap-0.5 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                <Star className="h-2.5 w-2.5" /> Featured
              </span>
            )}
            {isDemo && (
              <span className="rounded-full bg-navy-900/75 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                Sample
              </span>
            )}
            {isHud && (
              <span className="flex items-center gap-0.5 rounded-full bg-navy-900/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                <Building2 className="h-2.5 w-2.5" /> Community
              </span>
            )}
          </div>

          {/* Rent pill */}
          <div className="absolute bottom-2 right-2 rounded-full bg-navy-900/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
            ${listing.rent.toLocaleString()}/mo
          </div>
        </div>

        <CardContent className="flex flex-col gap-1.5 p-4">
          <h3 className="line-clamp-1 text-sm font-bold text-navy-900">
            {listing.title}
          </h3>
          <p className="flex items-center gap-1 text-xs text-neutral-600">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {listing.city}, {listing.state}
          </p>
          <div className="flex items-center gap-3 text-xs text-neutral-600">
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {bedsLabel}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" /> {listing.baths} ba
            </span>
          </div>
          {isDemo && (
            <p className="text-[10px] text-neutral-400">
              Sample listing · Apply to see real availability
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
