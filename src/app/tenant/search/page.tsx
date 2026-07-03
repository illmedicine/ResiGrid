import { ListingSearch } from "@/components/shared/ListingSearch";

export default function TenantSearchPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Search apartments</h1>
        <p className="text-sm text-neutral-600">
          ResiGrid properties are featured — nationwide listings are updated every 20 hours from a live rental database.
        </p>
      </div>
      <ListingSearch />
    </div>
  );
}
