import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import type { PropertyDoc } from "@/lib/types/models";

export function PropertyCard({ property }: { property: PropertyDoc }) {
  return (
    <Link href={`/pm/properties/view/?id=${property.id}`}>
      <Card className="p-4 transition-shadow hover:shadow-md">
        <CardContent className="flex items-start gap-3 p-0">
          <span className="rounded-lg bg-navy-900/5 p-2 text-navy-900">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-navy-900">
              {property.name}
            </p>
            <p className="flex items-center gap-1 text-xs text-neutral-600">
              <MapPin className="h-3.5 w-3.5" />
              {property.addressLine1}, {property.city}, {property.state}
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              {property.unitIds.length} unit
              {property.unitIds.length === 1 ? "" : "s"}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
