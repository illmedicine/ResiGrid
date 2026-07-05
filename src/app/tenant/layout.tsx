"use client";

import type { ReactNode } from "react";
import { Bell, FileText, Home, MessageSquare, Search, Wallet, Wrench } from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { PortalShell, type PortalNavItem } from "@/components/layout/PortalShell";
import { useMyNotices } from "@/lib/hooks/useMyNotices";

const navItems: PortalNavItem[] = [
  { href: "/tenant/dashboard", label: "Home", icon: Home },
  { href: "/tenant/pay", label: "Pay", icon: Wallet },
  { href: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/tenant/lease", label: "Lease", icon: FileText },
  { href: "/tenant/notices", label: "Notices", icon: Bell },
  { href: "/tenant/messages", label: "Messages", icon: MessageSquare },
  { href: "/tenant/search", label: "Search", icon: Search },
];

function TenantLayoutInner({ children }: { children: ReactNode }) {
  const { unreadCount } = useMyNotices();
  return (
    <PortalShell
      navItems={navItems}
      notificationBadge={{ count: unreadCount, href: "/tenant/notices" }}
    >
      {children}
    </PortalShell>
  );
}

export default function TenantLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="tenant">
      <TenantLayoutInner>{children}</TenantLayoutInner>
    </RoleGuard>
  );
}
