"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { Bath, BedDouble, ClipboardList, DollarSign, FileText, MapPin, Star } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { applicationFormsCol, listingsCol, unitsCol, propertiesCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PhotoUpload } from "@/components/pm/PhotoUpload";
import type { ApplicationFormDoc, UnitDoc, PropertyDoc } from "@/lib/types/models";

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

export function PublishListingForm({ unitId, propertyId }: { unitId: string; propertyId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  // Generate a stable random Firestore doc ref once per mount — avoids the
  // deterministic useId() bug where every listing overwrote doc "r0".
  const listingRef = useMemo(() => doc(listingsCol()), []);
  const [unit, setUnit] = useState<UnitDoc | null>(null);
  const [property, setProperty] = useState<PropertyDoc | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<Set<string>>(new Set());
  const [applicationForms, setApplicationForms] = useState<ApplicationFormDoc[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load PM's saved application forms
  useEffect(() => {
    if (!user) return;
    const q = query(applicationFormsCol(), where("pmId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      setApplicationForms(snap.docs.map((d) => ({ ...d.data(), id: d.id } as ApplicationFormDoc)));
    });
  }, [user]);

  // Load unit + property data to pre-fill the form
  useEffect(() => {
    if (!unitId) return;
    const unsub = onSnapshot(doc(db, "units", unitId), (snap) => {
      if (snap.exists()) setUnit({ ...snap.data(), id: snap.id } as UnitDoc);
    });
    return unsub;
  }, [unitId]);

  useEffect(() => {
    if (!propertyId) return;
    const unsub = onSnapshot(doc(db, "properties", propertyId), (snap) => {
      if (snap.exists()) setProperty({ ...snap.data(), id: snap.id } as PropertyDoc);
    });
    return unsub;
  }, [propertyId]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      availableFrom: new Date().toISOString().split("T")[0],
    },
  });

  // Pre-fill when unit/property loads
  useEffect(() => {
    if (unit && property) {
      setValue("rent", String(unit.rent) as unknown as number);
      setValue("beds", String(unit.beds) as unknown as number);
      setValue("baths", String(unit.baths) as unknown as number);
      setValue(
        "title",
        `${property.name} — Unit ${unit.unitNumber}`,
      );
    }
  }, [unit, property, setValue]);

  function toggleAmenity(a: string) {
    setAmenities((prev) => {
      const next = new Set(prev);
      next.has(a) ? next.delete(a) : next.add(a);
      return next;
    });
  }

  async function onSubmit(values: FormValues) {
    if (!user || !property) return;
    if (photos.length === 0) {
      setError("Add at least one photo before publishing.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await setDoc(listingRef, {
        id: listingRef.id,
        unitId,
        propertyId,
        ownerId: user.uid,
        title: values.title,
        description: values.description,
        rent: values.rent,
        beds: values.beds,
        baths: values.baths,
        photos,
        amenities: Array.from(amenities),
        ...(selectedFormId ? { applicationFormId: selectedFormId } : {}),
        city: property.city,
        state: property.state,
        zip: property.zip,
        addressLine1: property.addressLine1,
        availableFrom: new Date(values.availableFrom).getTime(),
        featured: true,
        status: "published",
        createdAt: Date.now(),
      });
      router.push("/pm/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish listing.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Property context */}
      {property && unit && (
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
          <MapPin className="h-5 w-5 shrink-0 text-orange-500" />
          <div className="text-sm">
            <p className="font-semibold text-navy-900">{property.name} · Unit {unit.unitNumber}</p>
            <p className="text-neutral-600">{property.addressLine1}, {property.city}, {property.state}</p>
          </div>
        </div>
      )}

      {/* Listing details */}
      <FormSection icon={Star} title="Listing headline">
        <Input
          label="Listing title"
          placeholder="e.g. Bright 2BR with Rooftop Access — Midtown"
          {...register("title")}
          error={errors.title?.message}
        />
        <Textarea
          label="Property description"
          rows={5}
          placeholder="Describe the unit — layout, finishes, building features, neighborhood highlights, transit access…"
          {...register("description")}
          error={errors.description?.message}
        />
      </FormSection>

      {/* Financials */}
      <FormSection icon={DollarSign} title="Rent & availability">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Input label="Monthly rent ($)" type="number" {...register("rent")} error={errors.rent?.message} />
          <Input
            label="Available from"
            type="date"
            {...register("availableFrom")}
            error={errors.availableFrom?.message}
          />
        </div>
      </FormSection>

      {/* Unit specs */}
      <FormSection icon={BedDouble} title="Unit details">
        <div className="grid grid-cols-3 gap-4">
          <Input label="Bedrooms" type="number" min="0" {...register("beds")} error={errors.beds?.message} />
          <Input label="Bathrooms" type="number" min="0" step="0.5" {...register("baths")} error={errors.baths?.message} />
        </div>
      </FormSection>

      {/* Photos */}
      <FormSection icon={FileText} title="Photos">
        <p className="mb-3 text-xs text-neutral-600">
          Upload high-quality photos to attract quality tenants. The first photo is your cover image.
          Supported: JPG, PNG, WEBP — max 10 photos.
        </p>
        <PhotoUpload
          storagePath={`resigrid/listings/${listingRef.id}`}
          uploadedUrls={photos}
          onChange={setPhotos}
        />
      </FormSection>

      {/* Application form */}
      <FormSection icon={ClipboardList} title="Application requirements">
        <p className="text-xs text-neutral-600">
          Attach an application form so tenants can apply directly from the listing.
          Create forms in the <a href="/pm/applications" className="text-orange-600 hover:underline">Applications</a> tab.
        </p>
        <select
          value={selectedFormId}
          onChange={(e) => setSelectedFormId(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        >
          <option value="">No application form (interest-based only)</option>
          {applicationForms.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        {selectedFormId && (
          <p className="text-xs text-green-700">
            ✓ Tenants will see an &quot;Apply Now&quot; button on this listing.
          </p>
        )}
      </FormSection>

      {/* Amenities */}
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
        <p className="mt-2 text-xs text-neutral-500">
          {amenities.size} amenity{amenities.size !== 1 ? "s" : ""} selected
        </p>
      </FormSection>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-5">
        <Button type="submit" disabled={submitting} size="lg">
          {submitting ? "Publishing…" : "Publish Listing"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Star;
  title: string;
  children: React.ReactNode;
}) {
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
