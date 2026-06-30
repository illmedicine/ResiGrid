import Link from "next/link";
import { BedDouble, Bath, MapPin } from "lucide-react";
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
  return (
    <Link href={href}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="flex h-36 items-center justify-center bg-neutral-100 text-neutral-600">
          {listing.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.photos[0]}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs">No photo</span>
          )}
        </div>
        <CardContent className="flex flex-col gap-1.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-navy-900">
              {listing.title}
            </h3>
            {listing.featured && <Badge tone="orange">Featured</Badge>}
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
            ${listing.rent.toLocaleString()}/mo
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
