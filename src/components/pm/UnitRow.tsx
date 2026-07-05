"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { arrayRemove, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Camera, Edit2, ExternalLink, Trash2, UserMinus } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhotoUpload } from "@/components/pm/PhotoUpload";
import type { ListingDoc, PropertyDoc, UnitDoc } from "@/lib/types/models";

const editSchema = z.object({
  unitNumber: z.string().min(1),
  beds: z.coerce.number().min(0),
  baths: z.coerce.number().min(0),
  rent: z.coerce.number().min(0),
  sqft: z.coerce.number().min(0).optional(),
});
type EditInput = z.input<typeof editSchema>;
type EditValues = z.output<typeof editSchema>;

export function UnitRow({ unit, property, activeListing }: {
  unit: UnitDoc;
  property: PropertyDoc;
  activeListing?: ListingDoc;
}) {
  const [mode, setMode] = useState<"none" | "edit">("none");
  const [deleting, setDeleting] = useState(false);
  const [removingTenant, setRemovingTenant] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitPhotos, setUnitPhotos] = useState<string[]>(unit.photos ?? []);
  const [savingPhotos, setSavingPhotos] = useState(false);

  const editForm = useForm<EditInput, unknown, EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { unitNumber: unit.unitNumber, beds: unit.beds, baths: unit.baths, rent: unit.rent, sqft: unit.sqft },
  });

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

  async function handleSavePhotos(urls: string[]) {
    setUnitPhotos(urls);
    setSavingPhotos(true);
    try {
      await updateDoc(doc(db, "units", unit.id), { photos: urls });
    } finally {
      setSavingPhotos(false);
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
            {/* Unit photos */}
            <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-navy-900">
                <Camera className="h-3.5 w-3.5 text-orange-500" />
                Unit photos
                {savingPhotos && <span className="font-normal text-neutral-400">Saving…</span>}
              </p>
              <p className="text-[11px] text-neutral-500">
                These photos appear on the listing and on the tenant&apos;s My Home dashboard. Unit photos override property photos.
              </p>
              <PhotoUpload
                storagePath={`resigrid/units/${unit.id}`}
                uploadedUrls={unitPhotos}
                onChange={handleSavePhotos}
                maxPhotos={10}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">Save details</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setMode("none")}>Cancel</Button>
            </div>
          </form>
        )}

        {/* Actions */}
        {mode === "none" && (
          <div className="flex flex-wrap gap-2">
            {unit.status === "vacant" && (
              activeListing ? (
                <Button size="sm" variant="outline" href="/pm/listings">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Manage listing
                </Button>
              ) : (
                <Button size="sm" href={`/pm/listings/new?unitId=${unit.id}&propertyId=${property.id}`}>
                  Publish listing
                </Button>
              )
            )}
            {unit.status === "occupied" && (
              <Button size="sm" variant="outline" onClick={handleRemoveTenant} disabled={removingTenant}>
                <UserMinus className="h-3.5 w-3.5" />
                {removingTenant ? "Removing…" : "Remove tenant"}
              </Button>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
