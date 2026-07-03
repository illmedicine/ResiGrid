"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Building2, FileText, Home, LayoutList, MessageSquare, Users, Wrench } from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { PMSubscriptionGate } from "@/components/pm/PMSubscriptionGate";
import { PortalShell, type PortalNavItem } from "@/components/layout/PortalShell";
import { PublicNavBar } from "@/components/layout/PublicNavBar";

const navItems: PortalNavItem[] = [
  { href: "/pm/dashboard", label: "Home", icon: Home },
  { href: "/pm/properties", label: "Properties", icon: Building2 },
  { href: "/pm/listings", label: "Listings", icon: LayoutList },
  { href: "/pm/leases", label: "Leases", icon: FileText },
  { href: "/pm/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/pm/messages", label: "Messages", icon: MessageSquare },
  { href: "/pm/team", label: "Team", icon: Users },
];

function PmLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Checkout page uses the public nav — not gated by subscription
  // (it IS the page that activates the subscription).
  if (pathname?.startsWith("/pm/checkout")) {
    return (
      <div className="flex flex-1 flex-col">
        <PublicNavBar />
        {children}
      </div>
    );
  }

  return (
    <PMSubscriptionGate>
      <PortalShell navItems={navItems}>{children}</PortalShell>
    </PMSubscriptionGate>
  );
}

export default function PmLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="property_manager">
      <PmLayoutContent>{children}</PmLayoutContent>
    </RoleGuard>
  );
}
