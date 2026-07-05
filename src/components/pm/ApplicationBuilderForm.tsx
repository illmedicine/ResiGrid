"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDoc, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { BedDouble, FileText, Send, User } from "lucide-react";
import { TenantSearchInput } from "@/components/pm/TenantSearchInput";
import { applicationsCol, listingsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useEffectivePMId } from "@/lib/hooks/useEffectivePMId";
import { useOwnerProperties } from "@/lib/hooks/useOwnerProperties";
import { useUnitsForProperty } from "@/lib/hooks/useUnitsForProperty";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { ApplicationDoc, ListingDoc, UserDoc } from "@/lib/types/models";

const schema = z.object({
  propertyId: z.string().min(1, "Select a property"),
  unitId: z.string().min(1, "Select a unit"),
  tenantId: z.string().min(1, "Search and select a registered tenant"),
  monthlyIncome: z.coerce.number().min(0).optional(),
  employer: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  moveInDate: z.string().optional(),
  message: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const FIELD_LABELS: Partial<Record<keyof FormInput, string>> = {
  propertyId: "Property",
  unitId: "Unit",
  tenantId: "Tenant",
};

export function ApplicationBuilderForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveId } = useEffectivePMId();
  const { properties } = useOwnerProperties(user?.uid);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<UserDoc | null>(null);
  const { units } = useUnitsForProperty(selectedPropertyId || undefined);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  function handleTenantSelect(tenant: UserDoc) {
    setSelectedTenant(tenant);
    setValue("tenantId", tenant.uid);
  }

  function onInvalid(errs: Record<string, unknown>) {
    const messages = Object.entries(errs).map(([field, err]) => {
      const label = FIELD_LABELS[field as keyof FormInput] ?? field;
      const msg = (err as { message?: string })?.message;
      return msg ? `${label}: ${msg}` : label;
    });
    setValidationErrors(messages);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Applications require a listingId — reuse one already backing this unit,
   * or create a minimal unpublished listing so the record has somewhere to point. */
  async function resolveListingId(propertyId: string, unitId: string): Promise<string> {
    const pmId = effectiveId ?? user!.uid;
    const existing = await getDocs(
      query(listingsCol(), where("unitId", "==", unitId), where("ownerId", "==", pmId)),
    );
    if (!existing.empty) return existing.docs[0].id;

    const property = properties.find((p) => p.id === propertyId);
    const unit = units.find((u) => u.id === unitId);
    const ref = doc(listingsCol());
    const listing: ListingDoc = {
      id: ref.id,
      unitId,
      propertyId,
      ownerId: pmId,
      title: property && unit ? `${property.name} — Unit ${unit.unitNumber}` : "Unit",
      description: "",
      rent: unit?.rent ?? 0,
      beds: unit?.beds ?? 0,
      baths: unit?.baths ?? 0,
      photos: [],
      city: property?.city ?? "",
      state: property?.state ?? "",
      zip: property?.zip ?? "",
      addressLine1: property?.addressLine1,
      featured: false,
      status: "draft",
      createdAt: Date.now(),
    };
    await setDoc(ref, listing);
    return ref.id;
  }

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setError(null);
    setSubmitting(true);
    try {
      const listingId = await resolveListingId(values.propertyId, values.unitId);
      const moveInTimestamp = values.moveInDate ? new Date(values.moveInDate).getTime() : undefined;

      const applicationData: Omit<ApplicationDoc, "id"> = {
        tenantId: values.tenantId,
        listingId,
        unitId: values.unitId,
        pmId: effectiveId ?? user.uid,
        status: "under_review",
        submittedAt: Date.now(),
        // Spread optional fields only when defined — Firestore rejects undefined
        ...(values.monthlyIncome ? { monthlyIncome: values.monthlyIncome } : {}),
        ...(values.employer ? { employer: values.employer } : {}),
        ...(values.emergencyContactName ? { emergencyContactName: values.emergencyContactName } : {}),
        ...(values.emergencyContactPhone ? { emergencyContactPhone: values.emergencyContactPhone } : {}),
        ...(moveInTimestamp != null ? { moveInDate: moveInTimestamp } : {}),
        ...(values.message ? { message: values.message } : {}),
      };

      const ref = await addDoc(applicationsCol(), applicationData);
      router.push(`/pm/applications/view/?id=${ref.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-6">
      {/* Property & Unit */}
      <Section icon={BedDouble} title="Property & Unit">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Property"
            {...register("propertyId")}
            onChange={(e) => {
              register("propertyId").onChange(e);
              setSelectedPropertyId(e.target.value);
              setValue("unitId", "");
            }}
            error={errors.propertyId?.message}
          >
            <option value="">Select property…</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          <Select
            label="Unit"
            {...register("unitId")}
            error={errors.unitId?.message}
            disabled={!selectedPropertyId}
          >
            <option value="">Select unit…</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>Unit {u.unitNumber} — ${u.rent}/mo</option>
            ))}
          </Select>
        </div>
      </Section>

      {/* Tenant */}
      <Section icon={User} title="Tenant">
        <div className="flex flex-col gap-2">
          <TenantSearchInput
            label="Search for a registered tenant (required — applications can only be created for tenants who already have a ResiGrid account)"
            onSelect={handleTenantSelect}
          />
          <input type="hidden" {...register("tenantId")} />
          {errors.tenantId && !selectedTenant && (
            <p className="text-xs text-red-600">{errors.tenantId.message}</p>
          )}
        </div>
      </Section>

      {/* Application details */}
      <Section icon={FileText} title="Application details (optional)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Monthly income ($)" type="number" {...register("monthlyIncome")} />
          <Input label="Employer" {...register("employer")} />
          <Input label="Emergency contact name" {...register("emergencyContactName")} />
          <Input label="Emergency contact phone" {...register("emergencyContactPhone")} />
          <Input label="Requested move-in date" type="date" {...register("moveInDate")} />
        </div>
        <div className="mt-4">
          <Textarea label="Note" rows={3} placeholder="Any additional context for this application…" {...register("message")} />
        </div>
      </Section>

      {/* Validation error summary */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold mb-1">Please fix the following before saving:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {validationErrors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-5">
        <Button
          type="button"
          disabled={submitting}
          onClick={() => {
            setValidationErrors([]);
            handleSubmit(onSubmit, onInvalid)();
          }}
        >
          <Send className="h-4 w-4" />
          {submitting ? "Creating…" : "Create application"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-navy-900">
        <Icon className="h-4 w-4 text-orange-500" />
        {title}
      </h3>
      {children}
    </div>
  );
}
