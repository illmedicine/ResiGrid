"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { useActiveLease } from "@/lib/hooks/useActiveLease";
import { leaseTermsCol, unitsCol } from "@/lib/firebase/firestore";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MaintenanceRequestForm } from "@/components/tenant/MaintenanceRequestForm";
import { MaintenanceRequestList } from "@/components/shared/MaintenanceRequestList";
import type { LeaseTermsDoc, UnitDoc } from "@/lib/types/models";

export default function TenantMaintenancePage() {
  const { user } = useAuth();
  const { lease } = useActiveLease(user?.uid);
  const [assignedUnit, setAssignedUnit] = useState<UnitDoc | null>(null);
  const [signedLease, setSignedLease] = useState<LeaseTermsDoc | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Fallback 1: unit with currentTenantId set (OnboardingWizard / Tenants page assignment).
  useEffect(() => {
    if (!user) return;
    const q = query(unitsCol(), where("currentTenantId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      setAssignedUnit(snap.empty ? null : ({ ...snap.docs[0].data(), id: snap.docs[0].id } as UnitDoc));
    });
  }, [user]);

  // Fallback 2: fully-signed leaseTerms doc (lease builder flow without unit update).
  useEffect(() => {
    if (!user) return;
    const q = query(leaseTermsCol(), where("tenantId", "==", user.uid), where("status", "==", "fully_signed"));
    return onSnapshot(q, (snap) => {
      setSignedLease(snap.empty ? null : ({ ...snap.docs[0].data(), id: snap.docs[0].id } as LeaseTermsDoc));
    });
  }, [user]);

  const unitId = lease?.unitId ?? assignedUnit?.id ?? signedLease?.unitId;
  const propertyId = assignedUnit?.propertyId ?? signedLease?.propertyId ?? "";
  const hasUnit = Boolean(unitId);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Maintenance</h1>
          <p className="text-sm text-neutral-600">
            Submit and track requests for your unit.
          </p>
        </div>
        {hasUnit && (
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            New request
          </Button>
        )}
      </div>

      {!hasUnit ? (
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
                  unitId={unitId!}
                  propertyId={propertyId}
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
