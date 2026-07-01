"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDoc, doc, setDoc } from "firebase/firestore";
import {
  BedDouble,
  BookTemplate,
  Car,
  Dog,
  FileText,
  Gavel,
  Save,
  Send,
  Settings,
  User,
  Zap,
} from "lucide-react";
import { LegalClausesSection } from "./LegalClausesSection";
import { TenantSearchInput } from "@/components/pm/TenantSearchInput";
import { db } from "@/lib/firebase/config";
import { leaseTermsCol, leaseTemplatesCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useOwnerProperties } from "@/lib/hooks/useOwnerProperties";
import { useUnitsForProperty } from "@/lib/hooks/useUnitsForProperty";
import { useLeaseTemplates } from "@/lib/hooks/useLeaseTemplates";
import { BUILTIN_TEMPLATES, computeEndDate } from "@/lib/lease/templates";
import { LEGAL_CLAUSE_CATEGORIES } from "@/lib/lease/legalClauses";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type {
  LeaseTermsDoc,
  LeaseTemplateDoc,
  LeaseTermType,
  UtilityResponsibility,
  ParkingType,
  UserDoc,
} from "@/lib/types/models";

const schema = z.object({
  propertyId: z.string().min(1, "Select a property"),
  unitId: z.string().min(1, "Select a unit"),
  tenantId: z.string().optional(),
  tenantName: z.string().min(1, "Tenant name is required"),
  tenantEmail: z.union([z.string().email("Valid email required"), z.literal("")]),
  startDate: z.string().min(1, "Start date is required"),
  termType: z.enum(["month-to-month", "12-month", "24-month", "custom"]),
  customMonths: z.coerce.number().min(1).optional(),
  rent: z.coerce.number().positive("Rent must be greater than 0"),
  securityDeposit: z.coerce.number().min(0),
  moveInFee: z.coerce.number().min(0),
  lateFeeDays: z.coerce.number().min(0),
  lateFeeAmount: z.coerce.number().min(0),
  gasResponsibility: z.enum(["tenant", "landlord", "split", "na"]),
  electricResponsibility: z.enum(["tenant", "landlord", "split", "na"]),
  waterResponsibility: z.enum(["tenant", "landlord", "split", "na"]),
  trashResponsibility: z.enum(["tenant", "landlord", "split", "na"]),
  internetResponsibility: z.enum(["tenant", "landlord", "split", "na"]),
  petsAllowed: z.boolean(),
  petsMaxCount: z.coerce.number().min(0).optional(),
  petsTypesAllowed: z.string().optional(),
  petsDeposit: z.coerce.number().min(0).optional(),
  petsMonthlyRent: z.coerce.number().min(0).optional(),
  parkingType: z.enum(["none", "included", "paid"]),
  parkingSpaces: z.coerce.number().min(0).optional(),
  parkingMonthlyFee: z.coerce.number().min(0).optional(),
  smokingAllowed: z.boolean(),
  quietHoursStart: z.string(),
  quietHoursEnd: z.string(),
  additionalTerms: z.string(),
  saveAsTemplate: z.boolean(),
  templateName: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const UTILITY_OPTS: { value: UtilityResponsibility; label: string }[] = [
  { value: "tenant", label: "Tenant" },
  { value: "landlord", label: "Landlord" },
  { value: "split", label: "Split" },
  { value: "na", label: "N/A" },
];

const TERM_OPTS = [
  { value: "12-month", label: "12 Months" },
  { value: "24-month", label: "24 Months" },
  { value: "month-to-month", label: "Month-to-Month" },
  { value: "custom", label: "Custom" },
];

export function LeaseBuilderForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { properties } = useOwnerProperties(user?.uid);
  const { templates: savedTemplates } = useLeaseTemplates(user?.uid);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedClauses, setSelectedClauses] = useState<Set<string>>(
    new Set(
      LEGAL_CLAUSE_CATEGORIES.flatMap((c) =>
        c.clauses.filter((cl) => cl.recommended).map((cl) => cl.id),
      ),
    ),
  );
  const { units } = useUnitsForProperty(selectedPropertyId || undefined);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      termType: "12-month",
      gasResponsibility: "tenant",
      electricResponsibility: "tenant",
      waterResponsibility: "landlord",
      trashResponsibility: "landlord",
      internetResponsibility: "na",
      petsAllowed: false,
      parkingType: "none",
      smokingAllowed: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      lateFeeDays: 5,
      lateFeeAmount: 50,
      securityDeposit: 0,
      moveInFee: 0,
      additionalTerms: "",
      saveAsTemplate: false,
    },
  });

  const termType = watch("termType");
  const petsAllowed = watch("petsAllowed");
  const parkingType = watch("parkingType");
  const saveAsTemplate = watch("saveAsTemplate");

  function handleTenantSelect(tenant: UserDoc) {
    setValue("tenantId", tenant.uid);
    setValue("tenantName", tenant.displayName ?? "");
    setValue("tenantEmail", tenant.email ?? "");
  }

  function applyTemplate(t: Omit<LeaseTemplateDoc, "id" | "pmId" | "createdAt"> | typeof BUILTIN_TEMPLATES[string]) {
    setValue("termType", t.termType as FormInput["termType"]);
    if (t.customMonths) setValue("customMonths", t.customMonths);
    setValue("lateFeeDays", t.lateFeeDays);
    setValue("lateFeeAmount", t.lateFeeAmount);
    setValue("moveInFee", t.moveInFee);
    setValue("gasResponsibility", t.utilities.gas);
    setValue("electricResponsibility", t.utilities.electric);
    setValue("waterResponsibility", t.utilities.water);
    setValue("trashResponsibility", t.utilities.trash);
    setValue("internetResponsibility", t.utilities.internet);
    setValue("petsAllowed", t.pets.allowed);
    setValue("petsMaxCount", t.pets.maxCount);
    setValue("petsTypesAllowed", t.pets.typesAllowed);
    setValue("petsDeposit", t.pets.deposit);
    setValue("petsMonthlyRent", t.pets.monthlyRent);
    setValue("parkingType", t.parking.type as FormInput["parkingType"]);
    setValue("parkingSpaces", t.parking.spaces);
    setValue("parkingMonthlyFee", t.parking.monthlyFee);
    setValue("smokingAllowed", t.smokingAllowed);
    setValue("quietHoursStart", t.quietHoursStart);
    setValue("quietHoursEnd", t.quietHoursEnd);
    setValue("additionalTerms", t.additionalTerms);
  }

  const FIELD_LABELS: Partial<Record<keyof FormInput, string>> = {
    propertyId: "Property",
    unitId: "Unit",
    tenantName: "Tenant name",
    tenantEmail: "Tenant email",
    startDate: "Start date",
    rent: "Monthly rent",
  };

  function onInvalid(errs: Record<string, unknown>) {
    const messages = Object.entries(errs)
      .map(([field, err]) => {
        const label = FIELD_LABELS[field as keyof FormInput] ?? field;
        const msg = (err as { message?: string })?.message;
        return msg ? `${label}: ${msg}` : label;
      });
    setValidationErrors(messages);
    // Scroll to top of form so user sees the errors
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(values: FormValues, action: "draft" | "send") {
    if (!user) return;
    setError(null);
    setSubmitting(true);
    try {
      const startTimestamp = new Date(values.startDate).getTime();
      const endTimestamp = computeEndDate(startTimestamp, values.termType, values.customMonths);

      const leaseData: Omit<LeaseTermsDoc, "id"> = {
        pmId: user.uid,
        unitId: values.unitId,
        propertyId: values.propertyId,
        tenantName: values.tenantName,
        tenantEmail: values.tenantEmail,
        termType: values.termType,
        startDate: startTimestamp,
        rent: values.rent,
        securityDeposit: values.securityDeposit,
        moveInFee: values.moveInFee,
        lateFeeDays: values.lateFeeDays,
        lateFeeAmount: values.lateFeeAmount,
        utilities: {
          gas: values.gasResponsibility,
          electric: values.electricResponsibility,
          water: values.waterResponsibility,
          trash: values.trashResponsibility,
          internet: values.internetResponsibility,
        },
        pets: {
          allowed: values.petsAllowed,
          maxCount: values.petsMaxCount ?? 0,
          typesAllowed: values.petsTypesAllowed ?? "",
          deposit: values.petsDeposit ?? 0,
          monthlyRent: values.petsMonthlyRent ?? 0,
        },
        parking: {
          type: values.parkingType,
          spaces: values.parkingSpaces ?? 0,
          monthlyFee: values.parkingMonthlyFee ?? 0,
        },
        smokingAllowed: values.smokingAllowed,
        quietHoursStart: values.quietHoursStart,
        quietHoursEnd: values.quietHoursEnd,
        additionalTerms: values.additionalTerms,
        status: action === "send" ? "sent" : "draft",
        selectedClauses: Array.from(selectedClauses),
        createdAt: Date.now(),
        // Spread optional fields only when defined — Firestore rejects undefined
        ...(values.tenantId ? { tenantId: values.tenantId } : {}),
        ...(values.customMonths != null ? { customMonths: values.customMonths } : {}),
        ...(endTimestamp != null ? { endDate: endTimestamp } : {}),
        ...(action === "send" ? { sentAt: Date.now() } : {}),
      };

      const ref = await addDoc(leaseTermsCol(), leaseData);

      if (values.saveAsTemplate && values.templateName) {
        const tmplRef = doc(leaseTemplatesCol());
        const template: LeaseTemplateDoc = {
          id: tmplRef.id,
          pmId: user.uid,
          name: values.templateName,
          termType: values.termType,
          securityDepositMultiplier: 1,
          moveInFee: values.moveInFee,
          lateFeeDays: values.lateFeeDays,
          lateFeeAmount: values.lateFeeAmount,
          utilities: leaseData.utilities,
          pets: leaseData.pets,
          parking: leaseData.parking,
          smokingAllowed: leaseData.smokingAllowed,
          quietHoursStart: values.quietHoursStart,
          quietHoursEnd: values.quietHoursEnd,
          additionalTerms: values.additionalTerms,
          createdAt: Date.now(),
          ...(values.customMonths != null ? { customMonths: values.customMonths } : {}),
        };
        await setDoc(tmplRef, template);
      }

      router.push(`/pm/leases/view/?id=${ref.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save lease");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Template selector */}
      <Section icon={BookTemplate} title="Start from a template">
        <div className="flex flex-wrap gap-2">
          {Object.entries(BUILTIN_TEMPLATES).map(([key, tmpl]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyTemplate(tmpl)}
              className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100"
            >
              {tmpl.name}
            </button>
          ))}
          {savedTemplates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              className="rounded-full border border-navy-200 bg-navy-900/5 px-3 py-1.5 text-xs font-medium text-navy-900 hover:bg-navy-900/10"
            >
              ⭐ {t.name}
            </button>
          ))}
        </div>
      </Section>

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

        {/* Tenant Info — with UID search */}
        <Section icon={User} title="Tenant information">
          <div className="flex flex-col gap-4">
            <TenantSearchInput
              label="Search for a registered tenant (auto-fills name, email & UID)"
              onSelect={handleTenantSelect}
            />
            <p className="text-xs text-neutral-500">
              Or enter manually if the tenant has not yet registered:
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Tenant full name"
                {...register("tenantName")}
                error={errors.tenantName?.message}
              />
              <Input
                label="Tenant email"
                type="email"
                {...register("tenantEmail")}
                error={errors.tenantEmail?.message}
              />
            </div>
            <Input
              label="Tenant UID (auto-filled on search)"
              {...register("tenantId")}
              placeholder="e.g. abc123xyz"
              className="font-mono text-xs"
            />
          </div>
        </Section>

        {/* Lease Term */}
        <Section icon={FileText} title="Lease term & financials">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <Select label="Term type" {...register("termType")} error={errors.termType?.message}>
                {TERM_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            {termType === "custom" && (
              <Input label="Months" type="number" min="1" {...register("customMonths")} />
            )}
            <Input label="Start date" type="date" {...register("startDate")} error={errors.startDate?.message} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input label="Monthly rent ($)" type="number" {...register("rent")} error={errors.rent?.message} />
            <Input label="Security deposit ($)" type="number" {...register("securityDeposit")} error={errors.securityDeposit?.message} />
            <Input label="Move-in fee ($)" type="number" {...register("moveInFee")} />
            <div />
            <Input label="Late fee grace (days)" type="number" {...register("lateFeeDays")} />
            <Input label="Late fee amount ($)" type="number" {...register("lateFeeAmount")} />
          </div>
        </Section>

        {/* Utilities */}
        <Section icon={Zap} title="Utilities — who pays?">
          <div className="flex flex-col gap-3">
            {(["gas", "electric", "water", "trash", "internet"] as const).map((util) => {
              const field = `${util}Responsibility` as keyof FormInput;
              return (
                <div key={util} className="flex items-center justify-between gap-4">
                  <span className="w-20 text-sm font-medium capitalize text-navy-900">{util}</span>
                  <Controller
                    name={field as "gasResponsibility"}
                    control={control}
                    render={({ field: f }) => (
                      <div className="flex gap-1 flex-wrap">
                        {UTILITY_OPTS.map((o) => (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => f.onChange(o.value)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                              f.value === o.value
                                ? "bg-orange-500 text-white"
                                : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>
              );
            })}
          </div>
        </Section>

        {/* Pets */}
        <Section icon={Dog} title="Pet policy">
          <Controller
            name="petsAllowed"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2">
                {[{ value: false, label: "No pets" }, { value: true, label: "Pets allowed" }].map((o) => (
                  <button
                    key={String(o.value)}
                    type="button"
                    onClick={() => field.onChange(o.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      String(field.value) === String(o.value)
                        ? "bg-orange-500 text-white"
                        : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          />
          {petsAllowed === true && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Input label="Max pets" type="number" min="1" {...register("petsMaxCount")} />
              <Input label="Pet deposit ($)" type="number" {...register("petsDeposit")} />
              <Input label="Monthly pet rent ($)" type="number" {...register("petsMonthlyRent")} />
              <div className="col-span-2 sm:col-span-4">
                <Input label="Types allowed (e.g. cats, dogs under 25 lbs)" {...register("petsTypesAllowed")} />
              </div>
            </div>
          )}
        </Section>

        {/* Parking */}
        <Section icon={Car} title="Parking">
          <Controller
            name="parkingType"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "none", label: "No parking" },
                  { value: "included", label: "Included" },
                  { value: "paid", label: "Paid parking" },
                ].map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => field.onChange(o.value as ParkingType)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      field.value === o.value
                        ? "bg-orange-500 text-white"
                        : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          />
          {(parkingType === "included" || parkingType === "paid") && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Input label="# of spaces" type="number" min="1" {...register("parkingSpaces")} />
              {parkingType === "paid" && (
                <Input label="Monthly fee ($)" type="number" {...register("parkingMonthlyFee")} />
              )}
            </div>
          )}
        </Section>

        {/* Rules */}
        <Section icon={Settings} title="Rules & additional terms">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-navy-900">Smoking</span>
              <Controller
                name="smokingAllowed"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    {[{ value: false, label: "Not allowed" }, { value: true, label: "Allowed" }].map((o) => (
                      <button
                        key={String(o.value)}
                        type="button"
                        onClick={() => field.onChange(o.value)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          String(field.value) === String(o.value)
                            ? "bg-orange-500 text-white"
                            : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-navy-900">Quiet hours</span>
              <div className="flex items-center gap-2">
                <Input type="time" {...register("quietHoursStart")} className="w-32" />
                <span className="text-sm text-neutral-600">to</span>
                <Input type="time" {...register("quietHoursEnd")} className="w-32" />
              </div>
            </div>
            <Textarea
              label="Additional terms & conditions"
              rows={4}
              placeholder="Enter any additional lease terms, rules, or disclosures…"
              {...register("additionalTerms")}
            />
          </div>
        </Section>

        {/* Legal clauses */}
        <Section icon={Gavel} title="Legal clauses & provisions">
          <p className="mb-4 text-xs leading-relaxed text-neutral-600">
            Select the legal language blocks to include in this lease agreement.
            Recommended clauses are pre-selected based on nationwide best practices.
          </p>
          <LegalClausesSection selected={selectedClauses} onChange={setSelectedClauses} />
        </Section>

        {/* Save as template */}
        <Section icon={Save} title="Save as template">
          <Controller
            name="saveAsTemplate"
            control={control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 rounded accent-orange-500"
                />
                <span className="text-sm text-navy-900">
                  Save these terms as a reusable template
                </span>
              </label>
            )}
          />
          {saveAsTemplate && (
            <div className="mt-3">
              <Input
                label="Template name"
                placeholder="e.g. 12-Month Pet-Friendly"
                {...register("templateName")}
              />
            </div>
          )}
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

        {/* Actions */}
        <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-5">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => {
              setValidationErrors([]);
              handleSubmit((v) => onSubmit(v, "draft"), onInvalid)();
            }}
          >
            <Save className="h-4 w-4" />
            Save draft
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={() => {
              setValidationErrors([]);
              handleSubmit((v) => onSubmit(v, "send"), onInvalid)();
            }}
          >
            <Send className="h-4 w-4" />
            {submitting ? "Saving…" : "Send to tenant"}
          </Button>
        </div>
      </form>
    </div>
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
