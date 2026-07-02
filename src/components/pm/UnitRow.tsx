"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDoc, arrayRemove, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Edit2, Trash2, UserMinus } from "lucide-react";
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

const editSchema = z.object({
  unitNumber: z.string().min(1),
  beds: z.coerce.number().min(0),
  baths: z.coerce.number().min(0),
  rent: z.coerce.number().min(0),
  sqft: z.coerce.number().min(0).optional(),
});
type EditInput = z.input<typeof editSchema>;
type EditValues = z.output<typeof editSchema>;

export function UnitRow({ unit, property }: { unit: UnitDoc; property: PropertyDoc }) {
  const [mode, setMode] = useState<"none" | "assign" | "edit">("none");
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingTenant, setRemovingTenant] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leaseForm = useForm<LeaseFormInput, unknown, LeaseFormValues>({ resolver: zodResolver(leaseSchema) });
  const editForm = useForm<EditInput, unknown, EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { unitNumber: unit.unitNumber, beds: unit.beds, baths: unit.baths, rent: unit.rent, sqft: unit.sqft },
  });

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

  async function onEdit(values: EditValues) {
    setError(null);
    try {
      await updateDoc(doc(db, "units", unit.id), {
        unitNumber: values.unitNumber,
        beds: values.beds,
        baths: values.baths,
        rent: values.rent,
        ...(values.sqft != null ? { sqft: values.sqft } : {}),
      });
      setMode("none");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update unit");
    }
  }

  async function handleRemoveTenant() {
    setRemovingTenant(true);
    setError(null);
    try {
      await updateDoc(doc(db, "units", unit.id), {
        status: "vacant",
        currentTenantId: null,
        currentLeaseId: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove tenant");
    } finally {
      setRemovingTenant(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteDoc(doc(db, "units", unit.id));
      await updateDoc(doc(db, "properties", property.id), { unitIds: arrayRemove(unit.id) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete unit");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-navy-900">Unit {unit.unitNumber}</p>
            <p className="text-xs text-neutral-600">
              {unit.beds} bd · {unit.baths} ba · ${unit.rent.toLocaleString()}/mo
              {unit.sqft ? ` · ${unit.sqft.toLocaleString()} sqft` : ""}
            </p>
            {unit.currentTenantId && (
              <p className="mt-0.5 text-xs text-neutral-500">
                Tenant: <span className="font-mono">{unit.currentTenantId}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Badge tone={unit.status === "vacant" ? "warning" : "success"}>{unit.status}</Badge>
            <button
              type="button"
              title="Edit unit"
              onClick={() => setMode(mode === "edit" ? "none" : "edit")}
              className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-navy-900"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            {!confirmDelete ? (
              <button
                type="button"
                title="Delete unit"
                onClick={() => setConfirmDelete(true)}
                className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs text-red-600">Delete?</span>
                <button type="button" onClick={handleDelete} disabled={deleting}
                  className="rounded bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700 disabled:opacity-50">
                  {deleting ? "…" : "Yes"}
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="rounded border border-neutral-300 px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-50">
                  No
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Edit form */}
        {mode === "edit" && (
          <form onSubmit={editForm.handleSubmit(onEdit)} className="flex flex-col gap-3 border-t border-neutral-200 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Unit #" {...editForm.register("unitNumber")} error={editForm.formState.errors.unitNumber?.message} />
              <Input label="Sqft" type="number" {...editForm.register("sqft")} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Beds" type="number" step="0.5" {...editForm.register("beds")} />
              <Input label="Baths" type="number" step="0.5" {...editForm.register("baths")} />
              <Input label="Rent ($)" type="number" {...editForm.register("rent")} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">Save</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setMode("none")}>Cancel</Button>
            </div>
          </form>
        )}

        {/* Actions */}
        {mode === "none" && (
          <div className="flex flex-wrap gap-2">
            {unit.status === "vacant" && (
              <>
                <Button size="sm" href={`/pm/listings/new?unitId=${unit.id}&propertyId=${property.id}`} disabled={publishing}>
                  Publish listing
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMode("assign")}>Assign tenant</Button>
              </>
            )}
            {unit.status === "occupied" && (
              <Button size="sm" variant="outline" onClick={handleRemoveTenant} disabled={removingTenant}>
                <UserMinus className="h-3.5 w-3.5" />
                {removingTenant ? "Removing…" : "Remove tenant"}
              </Button>
            )}
          </div>
        )}

        {/* Assign tenant */}
        {mode === "assign" && (
          <form onSubmit={leaseForm.handleSubmit(onAssign)} className="flex flex-col gap-3 border-t border-neutral-200 pt-3">
            <Input
              label="Tenant UID"
              placeholder="Copy from the Tenants page or tenant profile"
              {...leaseForm.register("tenantId")}
              error={leaseForm.formState.errors.tenantId?.message}
            />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Start date" type="date" {...leaseForm.register("startDate")} error={leaseForm.formState.errors.startDate?.message} />
              <Input label="End date" type="date" {...leaseForm.register("endDate")} error={leaseForm.formState.errors.endDate?.message} />
              <Input label="Due day" type="number" min={1} max={28} {...leaseForm.register("dueDay")} error={leaseForm.formState.errors.dueDay?.message} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">Create lease</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setMode("none")}>Cancel</Button>
            </div>
          </form>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
