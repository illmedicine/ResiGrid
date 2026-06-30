"use client";

import Link from "next/link";
import { FileText, Wallet, Wrench } from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { useActiveLease } from "@/lib/hooks/useActiveLease";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReputationSummary } from "@/components/tenant/ReputationSummary";

export default function TenantDashboardPage() {
  const { user, userDoc } = useAuth();
  const { lease, loading } = useActiveLease(user?.uid);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">
          Welcome{userDoc?.displayName ? `, ${userDoc.displayName}` : ""}
        </h1>
        <p className="text-sm text-neutral-600">
          Here&apos;s what&apos;s happening with your rental.
        </p>
      </div>

      <Card className="p-5">
        <CardContent className="flex flex-col gap-3 p-0">
          <h2 className="text-sm font-semibold text-navy-900">
            Current lease
          </h2>
          {loading ? (
            <p className="text-sm text-neutral-600">Loading…</p>
          ) : lease ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-navy-900">
                  ${lease.rentAmount.toLocaleString()}/mo
                </p>
                <p className="text-xs text-neutral-600">
                  Due on day {lease.dueDay} of each month
                </p>
              </div>
              <Button href="/tenant/pay" size="sm">
                <Wallet className="h-4 w-4" />
                Pay rent
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-neutral-600">
                No active lease on ResiGrid yet — you can still pay any
                landlord using the &quot;Pay anyone&quot; voucher flow.
              </p>
              <Button href="/tenant/pay" size="sm" className="w-fit">
                <Wallet className="h-4 w-4" />
                Pay rent
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {user && <ReputationSummary tenantId={user.uid} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickLink
          href="/tenant/payments"
          icon={FileText}
          label="Payment history"
        />
        <QuickLink
          href="/tenant/applications"
          icon={FileText}
          label="My applications"
        />
        <QuickLink
          href="/tenant/maintenance"
          icon={Wrench}
          label="Maintenance requests"
        />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof FileText;
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
