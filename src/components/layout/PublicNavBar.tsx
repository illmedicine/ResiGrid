import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export function PublicNavBar() {
  return (
    /* Outer wrapper is relatively positioned + overflow-visible so the logo
       can extend below the nav boundary and float over the page body. */
    <div className="relative z-40 overflow-visible">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:px-8">
        {/* Spacer on the left that matches the logo width so nav items
            don't collide — the logo itself is absolutely positioned */}
        <div className="w-[160px] md:w-[260px] shrink-0" />

        <nav className="flex items-center gap-2 ml-auto">
          <Button href="/listings" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Browse Listings
          </Button>
          <Button href="/login?role=tenant" variant="outline" size="sm">
            Tenant
          </Button>
          <Button href="/login?role=property_manager" variant="primary" size="sm">
            Property Manager
          </Button>
        </nav>
      </header>

      {/* Logo: absolutely anchored to the top-left of the wrapper so it
          overflows the nav bar downward and hovers over the page below */}
      <div
        className="absolute left-4 md:left-8"
        style={{ top: "-10px", zIndex: 50 }}
      >
        <Logo size={260} href="/" />
      </div>
    </div>
  );
}
