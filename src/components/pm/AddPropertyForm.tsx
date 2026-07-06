"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, setDoc } from "firebase/firestore";
import { Camera } from "lucide-react";
import { propertiesCol } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhotoUpload } from "@/components/pm/PhotoUpload";

const schema = z.object({
  name: z.string().min(1, "Property name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP is required"),
});

type FormValues = z.infer<typeof schema>;

export function AddPropertyForm({
  ownerId,
  onCreated,
}: {
  ownerId: string;
  onCreated?: (propertyId: string) => void;
}) {
  // Generate a stable random Firestore doc ref once per mount — useId() is
  // deterministic based on tree position, so reopening this form (unmount +
  // remount at the same JSX position) produced the SAME id every time,
  // silently overwriting the previously-created property via setDoc (same
  // bug already fixed for listings in PublishListingForm.tsx).
  const propertyRef = useMemo(() => doc(propertiesCol()), []);
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    setSubmitting(true);
    try {
      await setDoc(propertyRef, {
        id: propertyRef.id,
        ownerId,
        name: values.name,
        addressLine1: values.addressLine1,
        city: values.city,
        state: values.state,
        zip: values.zip,
        photos,
        amenities: [],
        unitIds: [],
        createdAt: Date.now(),
      });
      reset();
      setPhotos([]);
      onCreated?.(propertyRef.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add property.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Property name"
        placeholder="e.g. Maple Street Apartments"
        {...register("name")}
        error={errors.name?.message}
      />
      <Input
        label="Street address"
        {...register("addressLine1")}
        error={errors.addressLine1?.message}
      />
      <div className="grid grid-cols-3 gap-3">
        <Input label="City" {...register("city")} error={errors.city?.message} />
        <Input label="State" {...register("state")} error={errors.state?.message} />
        <Input label="ZIP" {...register("zip")} error={errors.zip?.message} />
      </div>

      {/* Property photos */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-navy-900">
          <Camera className="h-4 w-4 text-orange-500" />
          Property photos <span className="font-normal text-neutral-500">(optional)</span>
        </p>
        <PhotoUpload
          storagePath={`resigrid/properties/${propertyRef.id}`}
          uploadedUrls={photos}
          onChange={setPhotos}
          maxPhotos={8}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Add property"}
      </Button>
    </form>
  );
}
