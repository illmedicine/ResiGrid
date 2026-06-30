"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDoc, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { propertiesCol } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
  onCreated?: () => void;
}) {
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
      const ref = await addDoc(propertiesCol(), {
        id: "",
        ownerId,
        name: values.name,
        addressLine1: values.addressLine1,
        city: values.city,
        state: values.state,
        zip: values.zip,
        photos: [],
        amenities: [],
        unitIds: [],
        createdAt: Date.now(),
      });
      await updateDoc(doc(db, "propertyManagers", ownerId), {
        propertyIds: arrayUnion(ref.id),
      }).catch(() => undefined);
      reset();
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add property");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Property name"
        {...register("name")}
        error={errors.name?.message}
      />
      <Input
        label="Address"
        {...register("addressLine1")}
        error={errors.addressLine1?.message}
      />
      <div className="grid grid-cols-3 gap-3">
        <Input label="City" {...register("city")} error={errors.city?.message} />
        <Input label="State" {...register("state")} error={errors.state?.message} />
        <Input label="ZIP" {...register("zip")} error={errors.zip?.message} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Adding…" : "Add property"}
      </Button>
    </form>
  );
}
