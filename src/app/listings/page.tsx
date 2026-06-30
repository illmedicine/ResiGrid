import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { ListingSearch } from "@/components/shared/ListingSearch";

export default function ListingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8">
        <h1 className="mb-1 text-xl font-bold text-navy-900">
          Find your next apartment
        </h1>
        <p className="mb-5 text-sm text-neutral-600">
          Featured listings are managed by property managers on ResiGrid,
          with easy applications, viewing requests, and direct messaging.
        </p>
        <ListingSearch />
      </main>
    </div>
  );
}
