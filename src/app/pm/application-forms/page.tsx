"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { ClipboardList, Plus } from "lucide-react";
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Application forms</h1>
          <p className="text-sm text-neutral-600">
            Create custom application forms with screening criteria for your listings.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          <Plus className="h-4 w-4" />
          {creating ? "Cancel" : "New form"}
        </Button>
      </div>

      {creating && (
        <Card className="p-5">
          <CardContent className="p-0">
            <h2 className="mb-4 text-sm font-semibold text-navy-900">Create application form</h2>
            <ApplicationFormBuilder
              onSaved={() => setCreating(false)}
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
            <p className="text-sm font-semibold text-navy-900">No application forms yet</p>
            <p className="text-xs text-neutral-500">
              Create a form to specify what screening is required for your rental applicants —
              background checks, income verification, paystubs, and more.
            </p>
            <Button size="sm" onClick={() => setCreating(true)}>
              Create your first form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {forms.map((form) => (
            <FormRow key={form.id} form={form} />
          ))}
        </div>
      )}
    </div>
  );
}

function FormRow({ form }: { form: ApplicationFormDoc }) {
  const requirements = [
    form.requireBackgroundCheck && "Background check",
    form.requireCreditCheck && "Credit check",
    form.requireIncomeVerification && "Income verification",
    form.requirePaystubs && "Paystubs",
    form.requireBankStatements && "Bank statements",
    form.requirePhotoID && "Photo ID",
    form.requireUtilityStatement && "Utility statement",
    form.allowInstantApply && "Instant apply OK",
  ].filter(Boolean) as string[];

  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-2 p-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold text-navy-900">{form.name}</p>
          <p className="text-xs text-neutral-500">
            Created {new Date(form.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {requirements.map((r) => (
            <Badge key={r} tone={r === "Instant apply OK" ? "success" : "navy"}>
              {r}
            </Badge>
          ))}
        </div>
        {form.applicationFee && form.applicationFee > 0 && (
          <p className="text-xs text-neutral-600">
            Application fee: ${form.applicationFee}
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
