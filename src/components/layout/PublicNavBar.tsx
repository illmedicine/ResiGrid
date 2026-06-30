import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function PublicNavBar() {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:px-8">
      <Link href="/" className="text-lg font-bold text-navy-900">
        Resi<span className="text-orange-500">Grid</span>
      </Link>
      <nav className="flex items-center gap-2">
        <Button href="/listings" variant="ghost" size="sm" className="hidden sm:inline-flex">
          Browse Listings
        </Button>
        <Button href="/login" variant="outline" size="sm">
          Log in
        </Button>
        <Button href="/signup" variant="primary" size="sm">
          Sign up
        </Button>
      </nav>
    </header>
  );
}
