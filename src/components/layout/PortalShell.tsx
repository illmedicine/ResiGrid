"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, type LucideIcon } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { cn } from "@/lib/utils/cn";
import { signOut } from "@/lib/firebase/auth";
import { useAuth } from "@/lib/firebase/hooks";
import { Logo } from "@/components/ui/Logo";
import { getPrestigeTier } from "@/lib/rge/prestige";
import { db } from "@/lib/firebase/config";
import type { ReputationScoreDoc } from "@/lib/types/models";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface PortalShellProps {
  navItems: PortalNavItem[];
  children: ReactNode;
}

function UserAvatar({ photoURL, displayName }: { photoURL?: string | null; displayName?: string }) {
  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoURL}
        alt={displayName ?? "Profile"}
        className="h-8 w-8 rounded-full object-cover ring-2 ring-orange-200"
      />
    );
  }
  const initials = (displayName ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="h-8 w-8 rounded-full bg-navy-900 flex items-center justify-center ring-2 ring-orange-200">
      <span className="text-xs font-bold text-white">{initials}</span>
    </div>
  );
}

export function PortalShell({ navItems, children }: PortalShellProps) {
  const pathname = usePathname();
  const { user, userDoc } = useAuth();
  const [rgeScore, setRgeScore] = useState<number>(0);

  useEffect(() => {
    if (!user || userDoc?.role !== "tenant") return;
    const unsub = onSnapshot(doc(db, "reputationScores", user.uid), (snap) => {
      if (snap.exists()) setRgeScore((snap.data() as ReputationScoreDoc).score ?? 0);
    });
    return unsub;
  }, [user, userDoc?.role]);

  const prestige = userDoc?.role === "tenant" ? getPrestigeTier(rgeScore) : null;
  const settingsHref = userDoc?.role === "property_manager" ? "/pm/settings" : "/tenant/settings";
  const photoURL = user?.photoURL ?? userDoc?.photoURL;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop nav */}
      <header className="hidden md:flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-2 z-40">
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
                  active ? "bg-navy-900 text-white" : "text-navy-900 hover:bg-neutral-100",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {/* Profile picture + name + prestige */}
          <div className="flex items-center gap-2">
            <UserAvatar photoURL={photoURL} displayName={userDoc?.displayName} />
            <div className="flex flex-col leading-tight">
              {userDoc && (
                <span className="text-sm font-medium text-navy-900">{userDoc.displayName}</span>
              )}
              {prestige && (
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold w-fit",
                  prestige.badgeClass,
                )}>
                  {prestige.emoji} {prestige.label}
                </span>
              )}
            </div>
          </div>
          <Link
            href={settingsHref}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-navy-900"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-navy-900 hover:bg-neutral-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="flex md:hidden items-center justify-between border-b border-neutral-200 bg-white px-4 py-2 z-40">
        <Logo size={52} href="/" />
        <div className="flex items-center gap-2">
          <UserAvatar photoURL={photoURL} displayName={userDoc?.displayName} />
          <button
            onClick={() => signOut()}
            aria-label="Sign out"
            className="rounded-lg p-2 text-navy-900 hover:bg-neutral-100"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
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
