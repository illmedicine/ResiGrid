"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { FilePlus2 } from "lucide-react";
import { leaseTermsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useOwnerLeases } from "@/lib/hooks/useOwnerLeases";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { LeaseTermsDoc } from "@/lib/types/models";

const STATUS_TONE = {
  draft: "neutral",
  sent: "navy",
  tenant_signed: "warning",
  fully_signed: "success",
  expired: "danger",
} as const;

export default function PmLeasesPage() {
  const { user } = useAuth();
  const [leaseTerms, setLeaseTerms] = useState<LeaseTermsDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(leaseTermsCol(), where("pmId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLeaseTerms(
          snap.docs
            .map((d) => ({ ...d.data(), id: d.id } as LeaseTermsDoc))
            .sort((a, b) => b.createdAt - a.createdAt),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [user]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Lease Agreements</h1>
          <p className="text-sm text-neutral-600">
            Create, manage, and send leases to your tenants.
          </p>
        </div>
        <Button href="/pm/leases/new" size="sm">
          <FilePlus2 className="h-4 w-4" />
          Create lease
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : leaseTerms.length === 0 ? (
        <Card className="p-8">
          <CardContent className="flex flex-col items-center gap-4 p-0 text-center">
            <FilePlus2 className="h-10 w-10 text-neutral-300" />
            <div>
              <p className="font-semibold text-navy-900">No leases yet</p>
              <p className="mt-1 text-sm text-neutral-600">
                Create your first lease agreement and send it directly to a tenant.
              </p>
            </div>
            <Button href="/pm/leases/new" size="sm">
              Create your first lease
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {leaseTerms.map((lease) => (
            <Link key={lease.id} href={`/pm/leases/view/?id=${lease.id}`}>
              <Card className="p-4 transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-3 p-0">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">
                      {lease.tenantName || "Unnamed tenant"}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {new Date(lease.startDate).toLocaleDateString()} ·{" "}
                      ${lease.rent.toLocaleString()}/mo ·{" "}
                      {lease.termType === "month-to-month"
                        ? "Month-to-Month"
                        : lease.termType === "12-month"
                          ? "12 months"
                          : lease.termType === "24-month"
                            ? "24 months"
                            : `${lease.customMonths} months`}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[lease.status] as "neutral"}>
                    {lease.status.replace("_", " ")}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
