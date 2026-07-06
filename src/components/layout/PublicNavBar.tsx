"use client";

import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useHardNavFallback } from "@/lib/hooks/useHardNavFallback";

export function PublicNavBar() {
  const hardNavFallback = useHardNavFallback();
  return (
    <div className="relative z-40 overflow-visible" onClickCapture={hardNavFallback}>
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:px-8">
        {/* Spacer reserves room for the absolutely-positioned logo */}
        <div className="w-[110px] shrink-0 md:w-[260px]" />

        <nav className="flex items-center gap-2 ml-auto">
          <Button href="/listings" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Browse Listings
          </Button>
          <Button href="/pricing" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Pricing
          </Button>
          <Button href="/login" variant="primary" size="sm">
            Sign In
          </Button>
        </nav>
      </header>

      <div className="absolute left-2 md:left-8" style={{ top: "-6px", zIndex: 50 }}>
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
