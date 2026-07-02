"use client";

import { useRef, useState } from "react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Image, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { storage } from "@/lib/firebase/config";
import { cn } from "@/lib/utils/cn";

interface PhotoUploadProps {
  /** Full storage path prefix, e.g. "resigrid/listings/abc" or "resigrid/properties/xyz" */
  storagePath: string;
  /** @deprecated use storagePath instead */
  listingId?: string;
  uploadedUrls: string[];
  onChange: (urls: string[]) => void;
  maxPhotos?: number;
}

interface Preview {
  url: string;
  uploading: boolean;
  error?: string;
  storagePath?: string;
}

export function PhotoUpload({
  storagePath,
  listingId,
  uploadedUrls,
  onChange,
  maxPhotos = 10,
}: PhotoUploadProps) {
  const pathPrefix = storagePath ?? `resigrid/listings/${listingId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Preview[]>(
    uploadedUrls.map((url) => ({ url, uploading: false })),
  );
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList) {
    const accepted = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, maxPhotos - previews.length);

    if (!accepted.length) return;

    // Add previews immediately (optimistic)
    const newPreviews: Preview[] = accepted.map((f) => ({
      url: URL.createObjectURL(f),
      uploading: true,
    }));
    const startIndex = previews.length;
    setPreviews((prev) => [...prev, ...newPreviews]);

    // Upload each file to Firebase Storage
    const uploadedNew: string[] = [];
    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i];
      const path = `${pathPrefix}/photo-${Date.now()}-${i}`;
      try {
        const sRef = storageRef(storage, path);
        await uploadBytes(sRef, file);
        const downloadUrl = await getDownloadURL(sRef);
        uploadedNew.push(downloadUrl);
        setPreviews((prev) => {
          const next = [...prev];
          if (next[startIndex + i]) {
            next[startIndex + i] = { url: downloadUrl, uploading: false, storagePath: path };
          }
          return next;
        });
      } catch (err) {
        setPreviews((prev) => {
          const next = [...prev];
          if (next[startIndex + i]) {
            next[startIndex + i] = {
              ...next[startIndex + i],
              uploading: false,
              error: "Upload failed",
            };
          }
          return next;
        });
      }
    }
    onChange([...uploadedUrls, ...uploadedNew]);
  }

  function removePhoto(index: number) {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    const updated = uploadedUrls.filter(
      (url) => previews[index] && url !== previews[index].url,
    );
    onChange(updated);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Upload zone */}
      {previews.length < maxPhotos && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition",
            dragOver ? "border-orange-400 bg-orange-50" : "border-neutral-300 bg-neutral-50 hover:border-orange-300 hover:bg-orange-50/50",
          )}
        >
          <Upload className="h-8 w-8 text-neutral-400" />
          <p className="text-sm font-medium text-navy-900">
            Drop photos here or <span className="text-orange-500">browse</span>
          </p>
          <p className="text-xs text-neutral-500">
            JPG, PNG, WEBP — up to {maxPhotos} photos
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {previews.map((p, i) => (
            <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />

              {p.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
              {p.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/70">
                  <p className="text-center text-xs font-medium text-white px-1">{p.error}</p>
                </div>
              )}

              {/* Cover badge on first photo */}
              {i === 0 && !p.uploading && !p.error && (
                <span className="absolute left-1.5 top-1.5 rounded bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  COVER
                </span>
              )}

              {/* Delete button */}
              {!p.uploading && (
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}

          {/* Add more tile */}
          {previews.length < maxPhotos && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-[4/3] flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-orange-300 hover:text-orange-400"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[10px] font-medium">Add</span>
            </button>
          )}
        </div>
      )}

      {previews.length > 0 && (
        <p className="text-xs text-neutral-500">
          <Image className="inline h-3.5 w-3.5 mr-1" />
          {previews.filter((p) => !p.uploading && !p.error).length}/{previews.length} photos uploaded. First photo is the cover image.
        </p>
      )}
    </div>
  );
}
