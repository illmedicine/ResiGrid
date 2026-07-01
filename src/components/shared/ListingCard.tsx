import Link from "next/link";
import { BedDouble, Bath, Building2, ExternalLink, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ListingDoc } from "@/lib/types/models";

const HUD_PLACEHOLDER =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=60";

export function ListingCard({
  listing,
  href,
  external = false,
}: {
  listing: ListingDoc;
  href: string;
  external?: boolean;
}) {
  const isHud = listing.source === "hud_lihtc";
  const photo = listing.photos[0] ?? (isHud ? HUD_PLACEHOLDER : null);

  const inner = (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative flex h-36 items-center justify-center bg-neutral-100 text-neutral-600">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <Building2 className="h-8 w-8 text-neutral-300" />
        )}
        {isHud && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-navy-900/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            <Building2 className="h-3 w-3" /> Community Housing
          </span>
        )}
      </div>
      <CardContent className="flex flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-navy-900">
            {listing.title}
          </h3>
          {listing.featured && !isHud && <Badge tone="orange">Featured</Badge>}
          {isHud && external && (
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
          )}
        </div>
        <p className="flex items-center gap-1 text-xs text-neutral-600">
          <MapPin className="h-3.5 w-3.5" />
          {listing.city}, {listing.state}
        </p>
        <div className="flex items-center gap-3 text-xs text-neutral-600">
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" /> {listing.beds} bd
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" /> {listing.baths} ba
          </span>
        </div>
        <p className="text-base font-bold text-navy-900">
          ${listing.rent.toLocaleString()}
          <span className="text-xs font-normal text-neutral-600">/mo est.</span>
        </p>
        {isHud && (
          <p className="text-[10px] leading-tight text-neutral-500">
            Income limits apply · Contact housing authority for availability
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return <Link href={href}>{inner}</Link>;
}
