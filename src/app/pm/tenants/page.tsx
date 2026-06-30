"use client";

import { useAuth } from "@/lib/firebase/hooks";
import { useOwnerLeases } from "@/lib/hooks/useOwnerLeases";
import { useUserDisplayName } from "@/lib/hooks/useUserDisplayName";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { LeaseDoc } from "@/lib/types/models";

export default function PmTenantsPage() {
  const { user } = useAuth();
  const { leases, loading } = useOwnerLeases(user?.uid);

  const tenantIds = Array.from(new Set(leases.map((l) => l.tenantId)));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Tenants</h1>
        <p className="text-sm text-neutral-600">
          Tenants currently or previously leasing your units.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : tenantIds.length === 0 ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">
              No tenants yet. Assign a tenant to a unit to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        tenantIds.map((tenantId) => (
          <TenantRow
            key={tenantId}
            tenantId={tenantId}
            lease={leases.find((l) => l.tenantId === tenantId)!}
          />
        ))
      )}
    </div>
  );
}

function TenantRow({ tenantId, lease }: { tenantId: string; lease: LeaseDoc }) {
  const name = useUserDisplayName(tenantId);

  return (
    <Card className="p-4">
      <CardContent className="flex items-center justify-between p-0">
        <div>
          <p className="text-sm font-semibold text-navy-900">{name ?? tenantId}</p>
          <p className="text-xs text-neutral-600">
            ${lease.rentAmount.toLocaleString()}/mo · due day {lease.dueDay}
          </p>
        </div>
        <Button href="/pm/messages" size="sm" variant="outline">
          Message
        </Button>
      </CardContent>
    </Card>
  );
}
