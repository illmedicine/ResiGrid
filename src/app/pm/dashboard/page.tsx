"use client";

import Link from "next/link";
import {
  Building2,
  ClipboardList,
  FileText,
  FolderOpen,
  Home as HomeIcon,
  Landmark,
  Megaphone,
  MessageSquare,
  Settings,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { useOwnerProperties } from "@/lib/hooks/useOwnerProperties";
import { usePMSubscription } from "@/lib/hooks/usePMSubscription";
import { Card, CardContent } from "@/components/ui/Card";
import { WatermarkLogo } from "@/components/ui/WatermarkLogo";
import { PMBadgeSection } from "@/components/pm/PMBadgeSection";
import { EarlyAdopterWelcome } from "@/components/pm/EarlyAdopterWelcome";
import { SubscriptionStatusBanner } from "@/components/pm/SubscriptionStatusBanner";
import { PM_TIERS } from "@/lib/pricing/fees";

export default function PmDashboardPage() {
  const { user, userDoc } = useAuth();
  const { properties, loading } = useOwnerProperties(user?.uid);
  const { sub } = usePMSubscription(user?.uid);

  const totalUnits = properties.reduce((sum, p) => sum + p.unitIds.length, 0);
  const tier = sub?.tier;
  const tierConfig = tier ? PM_TIERS[tier] : null;

  return (
    <div className="relative flex flex-col gap-5">
      <WatermarkLogo size={500} opacity={0.04} />

      {/* ── Grid Early Adopter (auto-claim, badge, celebration, revocation) ── */}
      <EarlyAdopterWelcome />

      {/* ── Subscription Status Banner ── */}
      <SubscriptionStatusBanner uid={user?.uid} />

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-navy-900">
          Welcome{userDoc?.displayName ? `, ${userDoc.displayName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-neutral-600">
          {tierConfig
            ? `${tierConfig.name} · ${tierConfig.capacityLabel}`
            : "Here's an overview of your portfolio."}
        </p>
      </div>

      {/* ── Portfolio stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Properties" value={loading ? "—" : properties.length} />
        <Stat label="Total units" value={loading ? "—" : totalUnits} />
        {tierConfig && (
          <>
            <Stat
              label="Plan"
              value={tierConfig.name}
              sub={`$${tierConfig.annualFee}/yr`}
            />
            <Stat
              label="Monthly SaaS"
              value={`$${tierConfig.monthlyUnitFee}/unit`}
              sub="occupied only"
            />
          </>
        )}
      </div>

      {/* ── Quick links ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink href="/pm/properties" icon={Building2} label="Properties" />
        <QuickLink href="/pm/tenants" icon={FileText} label="Tenants" />
        <QuickLink href="/pm/listings" icon={HomeIcon} label="Listings" />
        <QuickLink href="/pm/leases" icon={FileText} label="Leases" />
        <QuickLink href="/pm/applications" icon={ClipboardList} label="Applications" />
        <QuickLink href="/pm/maintenance" icon={Wrench} label="Maintenance" />
        <QuickLink href="/pm/messages" icon={MessageSquare} label="Messages" />
        <QuickLink href="/pm/notices" icon={Megaphone} label="Notices" />
        <QuickLink href="/pm/documents" icon={FolderOpen} label="Documents" />
        <QuickLink href="/pm/payouts" icon={Landmark} label="Payment Center" />
        <QuickLink href="/pm/settings" icon={Settings} label="Settings" />
      </div>

      {/* ── Achievements / Badges ── */}
      {user && <PMBadgeSection uid={user.uid} />}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card className="p-4 text-center">
      <CardContent className="p-0">
        <div className="text-lg font-bold text-navy-900 leading-tight">{value}</div>
        {sub && <div className="text-[10px] text-orange-500 font-medium">{sub}</div>}
        <div className="text-xs text-neutral-600 mt-0.5">{label}</div>
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
