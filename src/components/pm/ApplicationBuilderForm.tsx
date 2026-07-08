"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  addDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { BedDouble, CheckCircle2, ClipboardList, FileText, Send, User } from "lucide-react";
import { TenantSearchInput } from "@/components/pm/TenantSearchInput";
import { applicationFormsCol, applicationsCol, listingsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useEffectivePMId } from "@/lib/hooks/useEffectivePMId";
import { useOwnerProperties } from "@/lib/hooks/useOwnerProperties";
import { useUnitsForProperty } from "@/lib/hooks/useUnitsForProperty";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { ApplicationDoc, ApplicationFormDoc, ListingDoc, UserDoc } from "@/lib/types/models";

const schema = z.object({
  propertyId: z.string().min(1, "Select a property"),
  unitId: z.string().min(1, "Select a unit"),
  applicationFormId: z.string().optional(),
  tenantId: z.string().optional(),
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
  applicationFormId: "Application template",
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
  const [templates, setTemplates] = useState<ApplicationFormDoc[]>([]);
  const [openedOnUnit, setOpenedOnUnit] = useState<string | null>(null);
  const { units } = useUnitsForProperty(selectedPropertyId || undefined);

  const pmId = effectiveId ?? user?.uid;

  // The PM's saved application templates — reusable across any unit.
  useEffect(() => {
    if (!pmId) return;
    const q = query(applicationFormsCol(), where("pmId", "==", pmId));
    return onSnapshot(q, (snap) => {
      setTemplates(
        snap.docs
          .map((d) => ({ ...d.data(), id: d.id }) as ApplicationFormDoc)
          .sort((a, b) => b.createdAt - a.createdAt),
      );
    });
  }, [pmId]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const watchedFormId = watch("applicationFormId");
  const selectedTemplate = templates.find((t) => t.id === watchedFormId);

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
    const owner = pmId!;
    const existing = await getDocs(
      query(listingsCol(), where("unitId", "==", unitId), where("ownerId", "==", owner)),
    );
    if (!existing.empty) return existing.docs[0].id;

    const property = properties.find((p) => p.id === propertyId);
    const unit = units.find((u) => u.id === unitId);
    const ref = doc(listingsCol());
    const listing: ListingDoc = {
      id: ref.id,
      unitId,
      propertyId,
      ownerId: owner,
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
    if (!user || !pmId) return;
    setError(null);

    // No tenant selected → open the application on the unit itself: attach
    // the template to the unit's listing so ANY tenant can fill it out and
    // submit for review.
    if (!values.tenantId) {
      if (!values.applicationFormId) {
        setValidationErrors([
          "Application template: choose a template to open this application to all applicants — or select a specific registered tenant below.",
        ]);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setSubmitting(true);
      try {
        const listingId = await resolveListingId(values.propertyId, values.unitId);
        await updateDoc(doc(listingsCol(), listingId), {
          applicationFormId: values.applicationFormId,
        });
        const unit = units.find((u) => u.id === values.unitId);
        setOpenedOnUnit(unit ? `Unit ${unit.unitNumber}` : "the unit");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to attach the application");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Tenant selected → create a direct application for that tenant.
    setSubmitting(true);
    try {
      const listingId = await resolveListingId(values.propertyId, values.unitId);
      const moveInTimestamp = values.moveInDate ? new Date(values.moveInDate).getTime() : undefined;

      const applicationData: Omit<ApplicationDoc, "id"> = {
        tenantId: values.tenantId,
        listingId,
        unitId: values.unitId,
        pmId,
        status: "under_review",
        submittedAt: Date.now(),
        // Spread optional fields only when defined — Firestore rejects undefined
        ...(values.applicationFormId ? { applicationFormId: values.applicationFormId } : {}),
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

  if (openedOnUnit) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
        <p className="text-base font-semibold text-green-800">
          Application is now open on {openedOnUnit}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-green-700">
          Any tenant can now fill it out from the unit&apos;s listing and submit it for your
          review. All submissions will appear on your Applications tab, grouped by unit, where
          you can approve or deny each applicant.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button href="/pm/listings" size="sm" variant="outline">Manage listing</Button>
          <Button href="/pm/applications" size="sm">View applications</Button>
        </div>
      </div>
    );
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

      {/* Application template */}
      <Section icon={ClipboardList} title="Application template">
        <div className="flex flex-col gap-2">
          <Select label="Template" {...register("applicationFormId")}>
            <option value="">
              {templates.length === 0 ? "No saved templates yet…" : "Select a template…"}
            </option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.applicationFee ? ` — $${t.applicationFee} fee` : ""}
              </option>
            ))}
          </Select>
          {selectedTemplate && (
            <div className="flex flex-wrap gap-1.5">
              {[
                selectedTemplate.requiredMonthlyIncome
                  ? `Income ≥ $${selectedTemplate.requiredMonthlyIncome.toLocaleString()}/mo`
                  : null,
                selectedTemplate.requireBackgroundCheck && "Background check",
                selectedTemplate.requireCreditCheck && "Credit check",
                selectedTemplate.requirePaystubs && "Paystubs",
                selectedTemplate.requireBankStatements && "Bank statements",
                selectedTemplate.requirePhotoID && "Photo ID",
                selectedTemplate.requireReferences && "References",
                selectedTemplate.applicationFee
                  ? `$${selectedTemplate.applicationFee} fee (${(selectedTemplate.feePolicy ?? "non_refundable").replace(/_/g, "-")})`
                  : "No fee",
              ]
                .filter(Boolean)
                .map((chip) => (
                  <span
                    key={String(chip)}
                    className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600"
                  >
                    {chip}
                  </span>
                ))}
            </div>
          )}
          <p className="text-xs text-neutral-500">
            Templates define the fields, screening requirements, and fee applicants must
            complete — build them once, reuse on any unit.{" "}
            <Link href="/pm/application-forms" className="font-semibold text-orange-600 hover:underline">
              Create or edit templates →
            </Link>
          </p>
        </div>
      </Section>

      {/* Tenant (optional) */}
      <Section icon={User} title="Specific tenant (optional)">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-neutral-500">
            Leave blank to open this application on the unit — any tenant can then fill it out
            from the listing and submit it for review. Or pick a registered tenant to create a
            direct application for them right now.
          </p>
          <TenantSearchInput
            label="Search registered tenants…"
            onSelect={handleTenantSelect}
          />
          <input type="hidden" {...register("tenantId")} />
          {selectedTenant && (
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <span className="rounded-full bg-orange-50 px-2 py-1 font-medium text-orange-700">
                {selectedTenant.displayName} ({selectedTenant.email})
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedTenant(null);
                  setValue("tenantId", "");
                }}
                className="text-neutral-400 underline hover:text-red-500"
              >
                clear
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* Application details — only meaningful for a direct application */}
      {selectedTenant && (
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
      )}

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
          {submitting
            ? "Working…"
            : selectedTenant
              ? "Create application for tenant"
              : "Open application on unit"}
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
