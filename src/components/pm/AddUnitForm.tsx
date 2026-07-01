"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { arrayUnion, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { unitsCol } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  unitNumber: z.string().min(1, "Unit number is required"),
  beds: z.coerce.number().min(0),
  baths: z.coerce.number().min(0),
  rent: z.coerce.number().positive("Enter a rent amount"),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function AddUnitForm({
  propertyId,
  onCreated,
}: {
  propertyId: string;
  onCreated?: (unitId: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    setSubmitting(true);
    try {
      const ref = doc(unitsCol());
      await setDoc(ref, {
        id: ref.id,
        propertyId,
        unitNumber: values.unitNumber,
        beds: values.beds,
        baths: values.baths,
        rent: values.rent,
        status: "vacant",
      });
      await updateDoc(doc(db, "properties", propertyId), {
        unitIds: arrayUnion(ref.id),
      });
      reset();
      onCreated?.(ref.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add unit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Unit number"
        {...register("unitNumber")}
        error={errors.unitNumber?.message}
      />
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Beds"
          type="number"
          {...register("beds")}
          error={errors.beds?.message}
        />
        <Input
          label="Baths"
          type="number"
          step="0.5"
          {...register("baths")}
          error={errors.baths?.message}
        />
        <Input
          label="Rent ($/mo)"
          type="number"
          {...register("rent")}
          error={errors.rent?.message}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Adding…" : "Add unit"}
      </Button>
    </form>
  );
}
