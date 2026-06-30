"use client";

import type { ReactNode } from "react";
import { Home, MessageSquare, Search, Wallet, Wrench } from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { PortalShell, type PortalNavItem } from "@/components/layout/PortalShell";

const navItems: PortalNavItem[] = [
  { href: "/tenant/dashboard", label: "Home", icon: Home },
  { href: "/tenant/pay", label: "Pay", icon: Wallet },
  { href: "/tenant/search", label: "Search", icon: Search },
  { href: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/tenant/messages", label: "Messages", icon: MessageSquare },
];

export default function TenantLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="tenant">
      <PortalShell navItems={navItems}>{children}</PortalShell>
    </RoleGuard>
  );
}
