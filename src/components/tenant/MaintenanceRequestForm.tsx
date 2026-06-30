"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDoc } from "firebase/firestore";
import { maintenanceRequestsCol } from "@/lib/firebase/firestore";
import { MAINTENANCE_CATEGORIES } from "@/lib/maintenance/categories";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { MaintenancePriority } from "@/lib/types/models";

const schema = z.object({
  categoryId: z.string().min(1),
  item: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  description: z.string().min(1, "Describe the issue"),
});

type FormValues = z.infer<typeof schema>;

interface MaintenanceRequestFormProps {
  tenantId: string;
  unitId: string;
  propertyId: string;
  onSubmitted?: () => void;
}

export function MaintenanceRequestForm({
  tenantId,
  unitId,
  propertyId,
  onSubmitted,
}: MaintenanceRequestFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium" },
  });

  const categoryId = watch("categoryId");
  const items =
    MAINTENANCE_CATEGORIES.find((c) => c.id === categoryId)?.items ?? [];

  async function onSubmit(values: FormValues) {
    setError(null);
    setSubmitting(true);
    try {
      const category =
        MAINTENANCE_CATEGORIES.find((c) => c.id === values.categoryId)
          ?.label ?? values.categoryId;
      await addDoc(maintenanceRequestsCol(), {
        id: "",
        unitId,
        propertyId,
        tenantId,
        category,
        item: values.item,
        description: values.description,
        photoUrls: [],
        status: "submitted",
        priority: values.priority as MaintenancePriority,
        createdAt: Date.now(),
      });
      reset();
      onSubmitted?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit request",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Select label="Category" {...register("categoryId")}>
        <option value="">Select a category…</option>
        {MAINTENANCE_CATEGORIES.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.label}
          </option>
        ))}
      </Select>

      <Select label="Item" disabled={!categoryId} {...register("item")}>
        <option value="">Select an item…</option>
        {items.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>

      <Select label="Priority" {...register("priority")}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </Select>

      <Textarea
        label="Describe the issue"
        rows={4}
        {...register("description")}
        error={errors.description?.message}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit request"}
      </Button>
    </form>
  );
}
