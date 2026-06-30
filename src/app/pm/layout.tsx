"use client";

import type { ReactNode } from "react";
import { ClipboardList, Home, MessageSquare, Building2, Wrench } from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { PortalShell, type PortalNavItem } from "@/components/layout/PortalShell";

const navItems: PortalNavItem[] = [
  { href: "/pm/dashboard", label: "Home", icon: Home },
  { href: "/pm/properties", label: "Properties", icon: Building2 },
  { href: "/pm/applications", label: "Applicants", icon: ClipboardList },
  { href: "/pm/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/pm/messages", label: "Messages", icon: MessageSquare },
];

export default function PmLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="property_manager">
      <PortalShell navItems={navItems}>{children}</PortalShell>
    </RoleGuard>
  );
}
