import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export function PublicNavBar() {
  return (
    <header className="relative flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2 md:px-8 overflow-visible">
      <Logo size={56} href="/" />
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
