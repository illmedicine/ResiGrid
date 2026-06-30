"use client";

import Link from "next/link";
import { Building2, ClipboardList, FileText, Home as HomeIcon, Landmark, Megaphone, Wrench } from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { useOwnerProperties } from "@/lib/hooks/useOwnerProperties";
import { Card, CardContent } from "@/components/ui/Card";

export default function PmDashboardPage() {
  const { user, userDoc } = useAuth();
  const { properties, loading } = useOwnerProperties(user?.uid);

  const totalUnits = properties.reduce((sum, p) => sum + p.unitIds.length, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">
          Welcome{userDoc?.displayName ? `, ${userDoc.displayName}` : ""}
        </h1>
        <p className="text-sm text-neutral-600">
          Here&apos;s an overview of your portfolio.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Properties" value={loading ? "—" : properties.length} />
        <Stat label="Units" value={loading ? "—" : totalUnits} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <QuickLink href="/pm/properties" icon={Building2} label="Manage properties" />
        <QuickLink href="/pm/tenants" icon={FileText} label="Tenants" />
        <QuickLink href="/pm/applications" icon={ClipboardList} label="Review applications" />
        <QuickLink href="/pm/leases" icon={FileText} label="Leases" />
        <QuickLink href="/pm/listings" icon={HomeIcon} label="Listings" />
        <QuickLink href="/pm/maintenance" icon={Wrench} label="Maintenance inbox" />
        <QuickLink href="/pm/notices" icon={Megaphone} label="Notices" />
        <QuickLink href="/pm/payouts" icon={Landmark} label="Payouts" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4 text-center">
      <CardContent className="p-0">
        <div className="text-xl font-bold text-navy-900">{value}</div>
        <div className="text-xs text-neutral-600">{label}</div>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Building2;
  label: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
        <span className="rounded-lg bg-navy-900/5 p-2 text-navy-900">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-sm font-medium text-navy-900">{label}</span>
      </Card>
    </Link>
  );
}
