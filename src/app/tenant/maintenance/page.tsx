"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { useActiveLease } from "@/lib/hooks/useActiveLease";
import { useUnit } from "@/lib/hooks/useUnit";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MaintenanceRequestForm } from "@/components/tenant/MaintenanceRequestForm";
import { MaintenanceRequestList } from "@/components/shared/MaintenanceRequestList";

export default function TenantMaintenancePage() {
  const { user } = useAuth();
  const { lease } = useActiveLease(user?.uid);
  const { unit } = useUnit(lease?.unitId);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Maintenance</h1>
          <p className="text-sm text-neutral-600">
            Submit and track requests for your unit.
          </p>
        </div>
        {lease && unit && (
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            New request
          </Button>
        )}
      </div>

      {!lease ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">
              Maintenance requests are available once you&apos;re assigned to
              a unit on a ResiGrid-managed property.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {showForm && (
            <Card className="p-5">
              <CardContent className="p-0">
                <MaintenanceRequestForm
                  tenantId={user!.uid}
                  unitId={lease.unitId}
                  propertyId={unit?.propertyId ?? ""}
                  onSubmitted={() => setShowForm(false)}
                />
              </CardContent>
            </Card>
          )}
          <MaintenanceRequestList scope="tenant" scopeId={user!.uid} />
        </>
      )}
    </div>
  );
}
