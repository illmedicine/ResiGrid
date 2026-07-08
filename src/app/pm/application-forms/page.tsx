"use client";

import { useEffect, useState } from "react";
import { deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { applicationFormsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { ApplicationFormBuilder } from "@/components/pm/ApplicationFormBuilder";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { ApplicationFormDoc } from "@/lib/types/models";

export default function PmApplicationFormsPage() {
  const { user } = useAuth();
  const [forms, setForms] = useState<ApplicationFormDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApplicationFormDoc | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(applicationFormsCol(), where("pmId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setForms(
        snap.docs
          .map((d) => d.data())
          .sort((a, b) => b.createdAt - a.createdAt),
      );
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [user]);

  async function handleDelete(form: ApplicationFormDoc) {
    if (!window.confirm(`Delete the "${form.name}" template? Units already using it keep their attached copy.`)) {
      return;
    }
    if (editing?.id === form.id) setEditing(null);
    await deleteDoc(doc(applicationFormsCol(), form.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Application templates</h1>
          <p className="text-sm text-neutral-600">
            Build reusable application templates with screening criteria and fees — attach one to
            any unit when you open applications.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setCreating((v) => !v);
          }}
        >
          <Plus className="h-4 w-4" />
          {creating ? "Cancel" : "New template"}
        </Button>
      </div>

      {creating && (
        <Card className="p-5">
          <CardContent className="p-0">
            <h2 className="mb-4 text-sm font-semibold text-navy-900">Create application template</h2>
            <ApplicationFormBuilder onSaved={() => setCreating(false)} />
          </CardContent>
        </Card>
      )}

      {editing && (
        <Card className="p-5">
          <CardContent className="p-0">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-navy-900">
                Edit template · {editing.name}
              </h2>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
            {/* key remounts the builder so its defaults reset when switching templates */}
            <ApplicationFormBuilder
              key={editing.id}
              existingForm={editing}
              onSaved={() => setEditing(null)}
            />
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : forms.length === 0 && !creating ? (
        <Card className="p-8 text-center">
          <CardContent className="flex flex-col items-center gap-3 p-0">
            <ClipboardList className="h-10 w-10 text-neutral-300" />
            <p className="text-sm font-semibold text-navy-900">No application templates yet</p>
            <p className="text-xs text-neutral-500">
              Create a template to specify what screening is required for your applicants —
              background checks, income verification, paystubs, and more.
            </p>
            <Button size="sm" onClick={() => setCreating(true)}>
              Create your first template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {forms.map((form) => (
            <FormRow
              key={form.id}
              form={form}
              onEdit={() => {
                setCreating(false);
                setEditing(form);
              }}
              onDelete={() => handleDelete(form)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FormRow({
  form,
  onEdit,
  onDelete,
}: {
  form: ApplicationFormDoc;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const requirements = [
    form.requiredMonthlyIncome && form.requiredMonthlyIncome > 0
      ? `Income ≥ $${form.requiredMonthlyIncome.toLocaleString()}/mo`
      : form.requireIncomeVerification && "Income verification",
    form.requireBackgroundCheck && "Background check",
    form.requireCreditCheck && "Credit check",
    form.requirePaystubs && "Paystubs",
    form.requireBankStatements && "Bank statements",
    form.requirePhotoID && "Photo ID",
    form.requireUtilityStatement && "Utility statement",
    form.requireReferences && "References",
    form.allowInstantApply && "Instant apply OK",
  ].filter(Boolean) as string[];

  const hasFee = form.applicationFee != null && form.applicationFee > 0;

  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-2 p-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold text-navy-900">{form.name}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-500">
              Created {new Date(form.createdAt).toLocaleDateString()}
            </span>
            <Button size="sm" variant="ghost" className="px-2" onClick={onEdit} aria-label="Edit template">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete template"
              className="rounded-md p-2 text-neutral-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {requirements.map((r) => (
            <Badge key={r} tone={r === "Instant apply OK" ? "success" : "navy"}>
              {r}
            </Badge>
          ))}
        </div>
        {hasFee && (
          <p className="text-xs text-neutral-600">
            Application fee: ${form.applicationFee}
            {form.feePolicy ? ` (${form.feePolicy.replace(/_/g, "-")})` : ""}
          </p>
        )}
        {form.customQuestions.length > 0 && (
          <p className="text-xs text-neutral-500">
            {form.customQuestions.length} custom question{form.customQuestions.length !== 1 ? "s" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
