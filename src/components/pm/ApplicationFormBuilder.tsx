"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, setDoc } from "firebase/firestore";
import { ClipboardList, Landmark, Plus, Trash2 } from "lucide-react";
import { applicationFormsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useSquareConnected } from "@/lib/hooks/useSquareConnected";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { ApplicationFormDoc } from "@/lib/types/models";

const schema = z.object({
  name: z.string().min(1, "Form name is required"),
  requireIncomeVerification: z.boolean(),
  requireBackgroundCheck: z.boolean(),
  requireCreditCheck: z.boolean(),
  requirePaystubs: z.boolean(),
  requireBankStatements: z.boolean(),
  requirePhotoID: z.boolean(),
  requireUtilityStatement: z.boolean(),
  requireReferences: z.boolean(),
  requiredMonthlyIncome: z.coerce.number().min(0).default(0),
  allowInstantApply: z.boolean(),
  applicationFee: z.coerce.number().min(0).default(0),
  feePolicy: z.enum(["waived", "refundable", "non_refundable"]).default("non_refundable"),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface ApplicationFormBuilderProps {
  /** When provided, the builder edits this template in place instead of creating a new one. */
  existingForm?: ApplicationFormDoc;
  onSaved?: (form: ApplicationFormDoc) => void;
}

const CRITERIA = [
  {
    key: "requireBackgroundCheck" as const,
    label: "Background check",
    description: "Tenant must consent to a third-party background screening.",
  },
  {
    key: "requireCreditCheck" as const,
    label: "Credit check",
    description: "Tenant authorizes a soft credit pull.",
  },
  {
    key: "requireIncomeVerification" as const,
    label: "Income verification",
    description: "Tenant must demonstrate income of at least 3× the monthly rent.",
  },
  {
    key: "requirePaystubs" as const,
    label: "Paystubs (last 2 months)",
    description: "Tenant uploads recent pay stubs or proof of income.",
  },
  {
    key: "requireBankStatements" as const,
    label: "Bank statements (last 2 months)",
    description: "Tenant uploads recent bank statements.",
  },
  {
    key: "requirePhotoID" as const,
    label: "Government-issued photo ID",
    description: "Tenant uploads a valid driver's license or passport.",
  },
  {
    key: "requireUtilityStatement" as const,
    label: "Utility statement / proof of residence",
    description: "Tenant uploads a recent utility bill or lease agreement.",
  },
  {
    key: "requireReferences" as const,
    label: "References",
    description: "Tenant provides personal or previous-landlord references with contact info.",
  },
  {
    key: "allowInstantApply" as const,
    label: "Allow instant application (no screening required)",
    description: "Tenants may apply without uploading documents; PM reviews manually.",
  },
] as const;

export function ApplicationFormBuilder({ existingForm, onSaved }: ApplicationFormBuilderProps) {
  const { user } = useAuth();
  const { connected: squareConnected } = useSquareConnected(Boolean(user));
  const [customQuestions, setCustomQuestions] = useState<string[]>(existingForm?.customQuestions ?? []);
  const [newQuestion, setNewQuestion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existingForm
      ? {
          name: existingForm.name,
          requireIncomeVerification: existingForm.requireIncomeVerification,
          requirePaystubs: existingForm.requirePaystubs,
          requirePhotoID: existingForm.requirePhotoID,
          requireBackgroundCheck: existingForm.requireBackgroundCheck,
          requireCreditCheck: existingForm.requireCreditCheck,
          requireBankStatements: existingForm.requireBankStatements,
          requireUtilityStatement: existingForm.requireUtilityStatement,
          requireReferences: existingForm.requireReferences ?? false,
          requiredMonthlyIncome: existingForm.requiredMonthlyIncome ?? 0,
          allowInstantApply: existingForm.allowInstantApply,
          applicationFee: existingForm.applicationFee ?? 0,
          feePolicy: existingForm.feePolicy ?? "non_refundable",
        }
      : {
          name: "",
          requireIncomeVerification: true,
          requirePaystubs: true,
          requirePhotoID: true,
          requireBackgroundCheck: false,
          requireCreditCheck: false,
          requireBankStatements: false,
          requireUtilityStatement: false,
          requireReferences: false,
          requiredMonthlyIncome: 0,
          allowInstantApply: false,
          applicationFee: 0,
          feePolicy: "non_refundable",
        },
  });

  const watchedFee = Number(watch("applicationFee") ?? 0);
  const watchedPolicy = watch("feePolicy");
  const feeNeedsPayments = watchedFee > 0 && watchedPolicy !== "waived";
  const feeBlocked = feeNeedsPayments && squareConnected === false;

  function addQuestion() {
    const q = newQuestion.trim();
    if (!q) return;
    setCustomQuestions((prev) => [...prev, q]);
    setNewQuestion("");
  }

  function removeQuestion(index: number) {
    setCustomQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(values: FormValues) {
    if (!user) return;
    if (values.applicationFee > 0 && values.feePolicy !== "waived" && squareConnected === false) {
      setError(
        "To charge an application fee, first connect a payout method in the Payment Center so applicants can pay you at submission — or set the fee policy to Waived.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const ref = existingForm
        ? doc(applicationFormsCol(), existingForm.id)
        : doc(applicationFormsCol());
      const form: ApplicationFormDoc = {
        id: ref.id,
        pmId: existingForm?.pmId ?? user.uid,
        name: values.name,
        requireIncomeVerification: values.requireIncomeVerification,
        requireBackgroundCheck: values.requireBackgroundCheck,
        requireCreditCheck: values.requireCreditCheck,
        requirePaystubs: values.requirePaystubs,
        requireBankStatements: values.requireBankStatements,
        requirePhotoID: values.requirePhotoID,
        requireUtilityStatement: values.requireUtilityStatement,
        requireReferences: values.requireReferences,
        requiredMonthlyIncome: values.requiredMonthlyIncome,
        allowInstantApply: values.allowInstantApply,
        applicationFee: values.applicationFee,
        feePolicy: values.feePolicy,
        customQuestions,
        createdAt: existingForm?.createdAt ?? Date.now(),
      };
      await setDoc(ref, form);
      setSaved(true);
      onSaved?.(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save form");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <ClipboardList className="mx-auto mb-3 h-8 w-8 text-green-600" />
        <p className="font-semibold text-green-800">
          {existingForm ? "Changes saved!" : "Application template saved!"}
        </p>
        <p className="mt-1 text-sm text-green-700">
          {existingForm
            ? "Units already using this template will pick up the update."
            : "You can attach this template to any unit when opening applications."}
        </p>
        {!existingForm && (
          <Button className="mt-4" variant="outline" onClick={() => setSaved(false)}>
            Create another template
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <Input
          label="Form name"
          placeholder='e.g. "Standard Application" or "Pet-Friendly Unit"'
          {...register("name")}
          error={errors.name?.message}
        />
      </div>

      {/* Screening criteria */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="mb-1 text-sm font-semibold text-navy-900">Screening requirements</h3>
        <p className="mb-4 text-xs text-neutral-500">
          Select which documents and checks are required from applicants. Tenants
          are informed of these requirements before they apply.
        </p>
        <div className="flex flex-col gap-3">
          {CRITERIA.map(({ key, label, description }) => (
            <label
              key={key}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 hover:border-orange-200 hover:bg-orange-50/50"
            >
              <input
                type="checkbox"
                {...register(key)}
                className="mt-0.5 h-4 w-4 accent-orange-500"
              />
              <div>
                <p className="text-sm font-medium text-navy-900">{label}</p>
                <p className="text-xs text-neutral-500">{description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Income requirement */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-navy-900">Income requirement</h3>
        <div className="flex items-start gap-3">
          <Input
            label="Required monthly income ($)"
            type="number"
            min="0"
            step="100"
            {...register("requiredMonthlyIncome")}
            className="w-44"
          />
          <p className="mt-6 text-xs text-neutral-500">
            Applicants are told the minimum up front; ResiGrid flags applications
            below it. Leave at $0 for no requirement.
          </p>
        </div>
      </div>

      {/* Application fee */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-navy-900">Application fee</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Application fee ($)"
            type="number"
            min="0"
            step="1"
            {...register("applicationFee")}
          />
          <Select label="Fee policy" {...register("feePolicy")} disabled={watchedFee <= 0}>
            <option value="non_refundable">Non-refundable</option>
            <option value="refundable">Refundable if not approved</option>
            <option value="waived">Waived (shown but not charged)</option>
          </Select>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Leave at $0 for free applications. When a fee is charged, applicants pay by card
          at submission and the fee deposits into your connected Square account. The policy
          is shown to applicants before they pay.
        </p>
        {feeNeedsPayments && squareConnected === false && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
            <p className="text-xs font-medium text-amber-800">
              Charging a fee requires a connected payout method so applicants can pay you at
              submission.
            </p>
            <Button href="/pm/payouts" size="sm" variant="outline" className="ml-auto">
              <Landmark className="h-3.5 w-3.5" />
              Open Payment Center
            </Button>
          </div>
        )}
      </div>

      {/* Custom questions */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-navy-900">Custom questions</h3>
        <div className="flex flex-col gap-2">
          {customQuestions.map((q, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
              <span className="flex-1 text-navy-900">{q}</span>
              <button
                type="button"
                onClick={() => removeQuestion(i)}
                className="text-neutral-400 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addQuestion())}
              placeholder="Add a question for applicants…"
              className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        <strong>Privacy commitment:</strong> All applicant documents and personal information
        collected through this form are stored securely and are accessible only to you and the
        applicant. ResiGrid will never sell, share, or disclose this information to any third party.
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" disabled={saving || feeBlocked}>
        <ClipboardList className="h-4 w-4" />
        {saving ? "Saving…" : existingForm ? "Save changes" : "Save application template"}
      </Button>
    </form>
  );
}
