"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDoc } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { storage } from "@/lib/firebase/config";
import { maintenanceRequestsCol } from "@/lib/firebase/firestore";
import { MAINTENANCE_CATEGORIES } from "@/lib/maintenance/categories";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { MaintenancePriority } from "@/lib/types/models";

const ROOMS = [
  "Kitchen", "Living Room", "Primary Bedroom", "Bedroom 2", "Bedroom 3",
  "Bathroom", "Bathroom 2", "Hallway", "Laundry Room", "Garage",
  "Patio / Balcony", "Basement", "Entire Unit", "Building Common Area", "Other",
];

const schema = z.object({
  categoryId: z.string().min(1),
  item: z.string().min(1),
  affectedRoom: z.string().min(1, "Select the affected room"),
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

interface PhotoPreview {
  objectUrl: string;
  uploading: boolean;
  downloadUrl?: string;
  error?: string;
}

export function MaintenanceRequestForm({
  tenantId,
  unitId,
  propertyId,
  onSubmitted,
}: MaintenanceRequestFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handlePhotoFiles(files: FileList) {
    const accepted = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 6 - photos.length);
    if (!accepted.length) return;

    const newPreviews: PhotoPreview[] = accepted.map((f) => ({
      objectUrl: URL.createObjectURL(f),
      uploading: true,
    }));
    const startIndex = photos.length;
    setPhotos((prev) => [...prev, ...newPreviews]);

    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i];
      const path = `maintenance/${propertyId}/${unitId}/${Date.now()}-${i}`;
      try {
        const sRef = storageRef(storage, path);
        await uploadBytes(sRef, file);
        const downloadUrl = await getDownloadURL(sRef);
        setPhotos((prev) => {
          const next = [...prev];
          if (next[startIndex + i]) {
            next[startIndex + i] = { ...next[startIndex + i], uploading: false, downloadUrl };
          }
          return next;
        });
      } catch {
        setPhotos((prev) => {
          const next = [...prev];
          if (next[startIndex + i]) {
            next[startIndex + i] = { ...next[startIndex + i], uploading: false, error: "Upload failed" };
          }
          return next;
        });
      }
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(values: FormValues) {
    setError(null);
    setSubmitting(true);
    try {
      const category =
        MAINTENANCE_CATEGORIES.find((c) => c.id === values.categoryId)
          ?.label ?? values.categoryId;
      const photoUrls = photos
        .filter((p) => !p.uploading && !p.error && p.downloadUrl)
        .map((p) => p.downloadUrl!);

      await addDoc(maintenanceRequestsCol(), {
        id: "",
        unitId,
        propertyId,
        tenantId,
        category,
        item: values.item,
        affectedRoom: values.affectedRoom,
        description: values.description,
        photoUrls,
        status: "submitted",
        priority: values.priority as MaintenancePriority,
        createdAt: Date.now(),
      });
      reset();
      setPhotos([]);
      onSubmitted?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit request",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const uploadingCount = photos.filter((p) => p.uploading).length;

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
          <option key={item} value={item}>{item}</option>
        ))}
      </Select>

      <Select label="Affected room" {...register("affectedRoom")} error={errors.affectedRoom?.message}>
        <option value="">Select the room…</option>
        {ROOMS.map((room) => (
          <option key={room} value={room}>{room}</option>
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

      {/* Photo upload */}
      <div>
        <label className="mb-1 block text-sm font-medium text-navy-900">
          Photos <span className="font-normal text-neutral-500">(optional, up to 6)</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handlePhotoFiles(e.target.files)}
        />
        {photos.length < 6 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500 hover:border-orange-300 hover:text-orange-500 transition"
          >
            <Camera className="h-4 w-4" />
            Add photos of the issue
          </button>
        )}
        {photos.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.objectUrl}
                  alt={`Photo ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                {p.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
                {p.error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/70">
                    <p className="text-center text-[10px] font-medium text-white px-1">{p.error}</p>
                  </div>
                )}
                {!p.uploading && (
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting || uploadingCount > 0}>
        {uploadingCount > 0
          ? `Uploading ${uploadingCount} photo${uploadingCount !== 1 ? "s" : ""}…`
          : submitting
          ? "Submitting…"
          : "Submit request"}
      </Button>
    </form>
  );
}
