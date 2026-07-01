"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { leasesCol, listingsCol } from "@/lib/firebase/firestore";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { PropertyDoc, UnitDoc } from "@/lib/types/models";

const leaseSchema = z.object({
  tenantId: z.string().min(1, "Tenant UID is required"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  dueDay: z.coerce.number().min(1).max(28),
});
type LeaseFormInput = z.input<typeof leaseSchema>;
type LeaseFormValues = z.output<typeof leaseSchema>;

export function UnitRow({
  unit,
  property,
}: {
  unit: UnitDoc;
  property: PropertyDoc;
}) {
  const [mode, setMode] = useState<"none" | "assign">("none");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeaseFormInput, unknown, LeaseFormValues>({ resolver: zodResolver(leaseSchema) });

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      await addDoc(listingsCol(), {
        id: "",
        unitId: unit.id,
        propertyId: property.id,
        ownerId: property.ownerId,
        title: `${property.name} — Unit ${unit.unitNumber}`,
        description: `${unit.beds} bed / ${unit.baths} bath unit at ${property.name}.`,
        rent: unit.rent,
        beds: unit.beds,
        baths: unit.baths,
        photos: property.photos,
        city: property.city,
        state: property.state,
        zip: property.zip,
        featured: true,
        status: "published",
        createdAt: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish listing");
    } finally {
      setPublishing(false);
    }
  }

  async function onAssign(values: LeaseFormValues) {
    setError(null);
    try {
      const leaseRef = await addDoc(leasesCol(), {
        id: "",
        unitId: unit.id,
        tenantId: values.tenantId,
        pmId: property.ownerId,
        signedStatus: "unsigned",
        startDate: new Date(values.startDate).getTime(),
        endDate: new Date(values.endDate).getTime(),
        rentAmount: unit.rent,
        dueDay: values.dueDay,
        createdAt: Date.now(),
      });
      await updateDoc(doc(db, "units", unit.id), {
        status: "occupied",
        currentTenantId: values.tenantId,
        currentLeaseId: leaseRef.id,
      });
      setMode("none");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign tenant");
    }
  }

  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-navy-900">
              Unit {unit.unitNumber}
            </p>
            <p className="text-xs text-neutral-600">
              {unit.beds} bd · {unit.baths} ba · ${unit.rent.toLocaleString()}/mo
            </p>
          </div>
          <Badge tone={unit.status === "vacant" ? "warning" : "success"}>
            {unit.status}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {unit.status === "vacant" && (
            <>
              {/* Link to full listing form with photos, description & amenities */}
              <Button
                size="sm"
                variant="primary"
                href={`/pm/listings/new?unitId=${unit.id}&propertyId=${property.id}`}
              >
                Publish listing
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMode(mode === "assign" ? "none" : "assign")}
              >
                Assign tenant
              </Button>
            </>
          )}
        </div>

        {mode === "assign" && (
          <form
            onSubmit={handleSubmit(onAssign)}
            className="flex flex-col gap-3 border-t border-neutral-200 pt-3"
          >
            <Input
              label="Tenant UID"
              placeholder="Copy from the Tenants page or tenant's profile"
              {...register("tenantId")}
              error={errors.tenantId?.message}
            />
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Start date"
                type="date"
                {...register("startDate")}
                error={errors.startDate?.message}
              />
              <Input
                label="End date"
                type="date"
                {...register("endDate")}
                error={errors.endDate?.message}
              />
              <Input
                label="Due day"
                type="number"
                min={1}
                max={28}
                {...register("dueDay")}
                error={errors.dueDay?.message}
              />
            </div>
            <Button type="submit" size="sm" className="w-fit">
              Create lease
            </Button>
          </form>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
