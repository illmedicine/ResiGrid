"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, onSnapshot, updateDoc, query, where } from "firebase/firestore";
import { Bath, BedDouble, ClipboardList, DollarSign, FileText, Loader2, MapPin, Star } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { applicationFormsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PhotoUpload } from "@/components/pm/PhotoUpload";
import type { ApplicationFormDoc, ListingDoc } from "@/lib/types/models";

const AMENITIES = [
  "Central A/C & Heat", "In-Unit Washer/Dryer", "Washer/Dryer in Building",
  "Dishwasher", "Hardwood Floors", "Stainless Steel Appliances",
  "Updated Kitchen", "Updated Bathroom", "Private Balcony/Patio",
  "Rooftop Access", "Pool", "Fitness Center", "Doorman/Concierge",
  "Elevator", "Storage Unit", "Bike Storage", "EV Charging",
  "Garage Parking", "Street Parking", "Controlled Access / Key Fob",
  "Pet Friendly", "High-Speed Internet Included",
  "Smart Home Features", "New Construction", "City Views",
];

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  rent: z.coerce.number().positive("Enter a rent amount"),
  beds: z.coerce.number().min(0),
  baths: z.coerce.number().min(0.5),
  availableFrom: z.string().min(1, "Select an available date"),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

function EditListingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const listingId = params.get("id");

  const [listing, setListing] = useState<ListingDoc | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<Set<string>>(new Set());
  const [applicationForms, setApplicationForms] = useState<ApplicationFormDoc[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) });

  // Load listing
  useEffect(() => {
    if (!listingId) { setLoadingListing(false); return; }
    const unsub = onSnapshot(doc(db, "listings", listingId), (snap) => {
      if (snap.exists()) {
        const data = { ...snap.data(), id: snap.id } as ListingDoc;
        setListing(data);
        setPhotos(data.photos ?? []);
        setAmenities(new Set(data.amenities ?? []));
        setSelectedFormId(data.applicationFormId ?? "");
        reset({
          title: data.title,
          description: data.description,
          rent: String(data.rent) as unknown as number,
          beds: String(data.beds) as unknown as number,
          baths: String(data.baths) as unknown as number,
          availableFrom: data.availableFrom
            ? new Date(data.availableFrom).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        });
      }
      setLoadingListing(false);
    });
    return unsub;
  }, [listingId, reset]);

  // Load PM's application forms
  useEffect(() => {
    if (!user) return;
    const q = query(applicationFormsCol(), where("pmId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      setApplicationForms(snap.docs.map((d) => ({ ...d.data(), id: d.id } as ApplicationFormDoc)));
    });
  }, [user]);

  function toggleAmenity(a: string) {
    setAmenities((prev) => {
      const next = new Set(prev);
      next.has(a) ? next.delete(a) : next.add(a);
      return next;
    });
  }

  async function onSubmit(values: FormValues) {
    if (!listingId || !listing) return;
    if (photos.length === 0) { setError("Add at least one photo."); return; }
    setError(null);
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "listings", listingId), {
        title: values.title,
        description: values.description,
        rent: values.rent,
        beds: values.beds,
        baths: values.baths,
        photos,
        amenities: Array.from(amenities),
        availableFrom: new Date(values.availableFrom).getTime(),
        ...(selectedFormId ? { applicationFormId: selectedFormId } : { applicationFormId: null }),
      });
      router.push("/pm/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save listing.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingListing) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col gap-3 py-12 text-center">
        <p className="text-sm text-neutral-600">Listing not found.</p>
        <Button variant="outline" href="/pm/listings">Back to listings</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Edit listing</h1>
          <p className="text-sm text-neutral-600">
            Changes are saved to the live listing immediately.
          </p>
        </div>
        <Button size="sm" variant="outline" href="/pm/listings">Cancel</Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* Location context (read-only) */}
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <MapPin className="h-4 w-4 shrink-0 text-orange-500" />
          <p className="text-sm text-neutral-700">
            {listing.addressLine1 ?? listing.city}, {listing.city}, {listing.state} {listing.zip}
          </p>
        </div>

        <FormSection icon={Star} title="Listing headline">
          <Input
            label="Listing title"
            {...register("title")}
            error={errors.title?.message}
          />
          <Textarea
            label="Description"
            rows={5}
            {...register("description")}
            error={errors.description?.message}
          />
        </FormSection>

        <FormSection icon={DollarSign} title="Rent & availability">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monthly rent ($)" type="number" {...register("rent")} error={errors.rent?.message} />
            <Input label="Available from" type="date" {...register("availableFrom")} error={errors.availableFrom?.message} />
          </div>
        </FormSection>

        <FormSection icon={BedDouble} title="Unit details">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Bedrooms" type="number" min="0" {...register("beds")} error={errors.beds?.message} />
            <Input label="Bathrooms" type="number" min="0" step="0.5" {...register("baths")} error={errors.baths?.message} />
          </div>
        </FormSection>

        <FormSection icon={FileText} title="Photos">
          <PhotoUpload
            storagePath={`resigrid/listings/${listingId}`}
            uploadedUrls={photos}
            onChange={setPhotos}
          />
        </FormSection>

        <FormSection icon={ClipboardList} title="Application form">
          <select
            value={selectedFormId}
            onChange={(e) => setSelectedFormId(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">No form (interest-based only)</option>
            {applicationForms.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </FormSection>

        <FormSection icon={Bath} title="Amenities">
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  amenities.has(a)
                    ? "bg-orange-500 text-white"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:border-orange-300 hover:text-orange-600"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-neutral-500">{amenities.size} selected</p>
        </FormSection>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 border-t border-neutral-200 pt-4">
          <Button type="submit" disabled={submitting} size="lg">
            {submitting ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/pm/listings")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function FormSection({ icon: Icon, title, children }: { icon: typeof Star; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-navy-900">
        <Icon className="h-4 w-4 text-orange-500" />
        {title}
      </h3>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

export default function EditListingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-orange-500" /></div>}>
      <EditListingContent />
    </Suspense>
  );
}
