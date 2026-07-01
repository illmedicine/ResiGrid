import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export function PublicNavBar() {
  return (
    <div className="relative z-40 overflow-visible">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:px-8">
        {/* Spacer reserves room for the absolutely-positioned logo */}
        <div className="w-[110px] shrink-0 md:w-[260px]" />

        <nav className="flex items-center gap-1.5 ml-auto">
          <Button href="/listings" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Browse Listings
          </Button>
          <Button href="/login?role=tenant" variant="outline" size="sm">
            Tenant
          </Button>
          <Button href="/login?role=property_manager" variant="primary" size="sm" className="hidden xs:inline-flex">
            Property Manager
          </Button>
          {/* Compact PM button only visible on very small screens */}
          <Button href="/login?role=property_manager" variant="primary" size="sm" className="xs:hidden">
            PM
          </Button>
        </nav>
      </header>

      <div
        className="absolute left-2 md:left-8"
        style={{ top: "-6px", zIndex: 50 }}
      >
        {/* Responsive logo — 110px mobile, 260px desktop */}
        <span className="md:hidden">
          <Logo size={110} href="/" />
        </span>
        <span className="hidden md:block">
          <Logo size={260} href="/" />
        </span>
      </div>
    </div>
  );
}
