"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { signOut } from "@/lib/firebase/auth";
import { useAuth } from "@/lib/firebase/hooks";
import { Logo } from "@/components/ui/Logo";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface PortalShellProps {
  navItems: PortalNavItem[];
  children: ReactNode;
}

export function PortalShell({ navItems, children }: PortalShellProps) {
  const pathname = usePathname();
  const { userDoc } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop nav — logo is IN the flow so it never overlaps content */}
      <header className="hidden md:flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-2 z-40">
        {/* Logo fits within nav height — no absolute/overflow positioning in portals */}
        <Logo size={72} href="/" />

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-navy-900 text-white"
                    : "text-navy-900 hover:bg-neutral-100",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {userDoc && (
            <span className="text-sm text-neutral-600">{userDoc.displayName}</span>
          )}
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-navy-900 hover:bg-neutral-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* Mobile top bar — logo in flow, no overflow */}
      <header className="flex md:hidden items-center justify-between border-b border-neutral-200 bg-white px-4 py-2 z-40">
        <Logo size={52} href="/" />
        <button
          onClick={() => signOut()}
          aria-label="Sign out"
          className="rounded-lg p-2 text-navy-900 hover:bg-neutral-100"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <main
        className="relative flex-1 px-4 py-5 md:px-8 md:py-6"
        style={{
          paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))",
          backgroundImage: `linear-gradient(rgba(248,249,251,0.96), rgba(248,249,251,0.96)),
            url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 inset-x-0 z-10 flex md:hidden items-stretch justify-around border-t border-neutral-200 bg-white"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 min-h-[52px] px-1 text-xs font-medium",
                active ? "text-orange-500" : "text-neutral-600",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
