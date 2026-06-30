"use client";

import { useAuth } from "@/lib/firebase/hooks";
import { useOwnerLeases } from "@/lib/hooks/useOwnerLeases";
import { useUserDisplayName } from "@/lib/hooks/useUserDisplayName";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { LeaseDoc } from "@/lib/types/models";

export default function PmLeasesPage() {
  const { user } = useAuth();
  const { leases, loading } = useOwnerLeases(user?.uid);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Leases</h1>
        <p className="text-sm text-neutral-600">All leases across your properties.</p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : leases.length === 0 ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">No leases yet.</p>
          </CardContent>
        </Card>
      ) : (
        leases.map((lease) => <LeaseRow key={lease.id} lease={lease} />)
      )}
    </div>
  );
}

function LeaseRow({ lease }: { lease: LeaseDoc }) {
  const tenantName = useUserDisplayName(lease.tenantId);

  return (
    <Card className="p-4">
      <CardContent className="flex items-center justify-between p-0">
        <div>
          <p className="text-sm font-semibold text-navy-900">
            {tenantName ?? lease.tenantId}
          </p>
          <p className="text-xs text-neutral-600">
            ${lease.rentAmount.toLocaleString()}/mo ·{" "}
            {new Date(lease.startDate).toLocaleDateString()} –{" "}
            {new Date(lease.endDate).toLocaleDateString()}
          </p>
        </div>
        <Badge tone={lease.signedStatus === "fully_signed" ? "success" : "warning"}>
          {lease.signedStatus.replace("_", " ")}
        </Badge>
      </CardContent>
    </Card>
  );
}
