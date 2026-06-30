import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { ListingSearch } from "@/components/shared/ListingSearch";

export default function ListingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />

      {/* Edge-to-edge hero band */}
      <section
        className="px-4 py-16 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,58,0.82), rgba(11,31,58,0.82)),
            url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1 className="text-2xl font-bold text-orange-400 md:text-4xl">
          Find your next apartment
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/70 md:text-base">
          Featured listings include easy applications, viewing requests, and
          direct messaging — all through ResiGrid.
        </p>
      </section>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
        <ListingSearch />
      </main>
    </div>
  );
}
