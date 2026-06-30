"use client";

import { useAuth } from "@/lib/firebase/hooks";
import { useOwnerMaintenanceRequests } from "@/lib/hooks/useOwnerMaintenanceRequests";
import { Card, CardContent } from "@/components/ui/Card";
import { MaintenanceInboxRow } from "@/components/pm/MaintenanceInboxRow";

export default function PmMaintenancePage() {
  const { user } = useAuth();
  const { requests, loading } = useOwnerMaintenanceRequests(user?.uid);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Maintenance inbox</h1>
        <p className="text-sm text-neutral-600">
          Requests submitted by tenants across your properties.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : requests.length === 0 ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">No maintenance requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        requests.map((req) => <MaintenanceInboxRow key={req.id} request={req} />)
      )}
    </div>
  );
}
