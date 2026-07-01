"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  DoorOpen,
  FileText,
  LayoutDashboard,
  User,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { AddPropertyForm } from "@/components/pm/AddPropertyForm";
import { AddUnitForm } from "@/components/pm/AddUnitForm";
import { TenantSearchInput } from "@/components/pm/TenantSearchInput";
import type { UserDoc } from "@/lib/types/models";

type Step = "property" | "unit" | "tenant" | "done";

const STEPS: { key: Step; label: string; icon: typeof Building2 }[] = [
  { key: "property", label: "Property", icon: Building2 },
  { key: "unit", label: "Unit", icon: DoorOpen },
  { key: "tenant", label: "Tenant", icon: User },
  { key: "done", label: "Done", icon: CheckCircle2 },
];

export function OnboardingWizard() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("property");
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<UserDoc | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const currentIndex = STEPS.findIndex((s) => s.key === step);

  function handlePropertyCreated(id: string) {
    setPropertyId(id);
    setStep("unit");
  }

  function handleUnitCreated(id: string) {
    setUnitId(id);
    setStep("tenant");
  }

  async function handleAssignTenant() {
    if (!unitId || !selectedTenant) return;
    setAssigning(true);
    setAssignError(null);
    try {
      await updateDoc(doc(db, "units", unitId), {
        currentTenantId: selectedTenant.uid,
        status: "occupied",
      });
      setStep("done");
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Failed to assign tenant");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const done = i < currentIndex;
          const active = s.key === step;
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center gap-1">
              <div
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  done
                    ? "bg-green-100 text-green-700"
                    : active
                      ? "bg-navy-900 text-white"
                      : "bg-neutral-100 text-neutral-400",
                ].join(" ")}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={[
                  "hidden text-xs font-medium sm:block",
                  active ? "text-navy-900" : done ? "text-green-700" : "text-neutral-400",
                ].join(" ")}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 text-neutral-300" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {step === "property" && (
        <Card className="p-5">
          <CardContent className="flex flex-col gap-4 p-0">
            <div>
              <h2 className="text-base font-semibold text-navy-900">Add your property</h2>
              <p className="mt-0.5 text-xs text-neutral-600">
                Tell us about the rental address where your tenant lives.
              </p>
            </div>
            <AddPropertyForm ownerId={user?.uid ?? ""} onCreated={handlePropertyCreated} />
          </CardContent>
        </Card>
      )}

      {step === "unit" && propertyId && (
        <Card className="p-5">
          <CardContent className="flex flex-col gap-4 p-0">
            <div>
              <h2 className="text-base font-semibold text-navy-900">Add a unit</h2>
              <p className="mt-0.5 text-xs text-neutral-600">
                Add the specific unit your tenant occupies. You can add more units later.
              </p>
            </div>
            <AddUnitForm
              propertyId={propertyId}
              onCreated={handleUnitCreated}
            />
            <button
              type="button"
              onClick={() => setStep("tenant")}
              className="text-left text-xs text-neutral-500 underline-offset-2 hover:underline"
            >
              Skip — I&apos;ll add units later
            </button>
          </CardContent>
        </Card>
      )}

      {step === "tenant" && (
        <Card className="p-5">
          <CardContent className="flex flex-col gap-4 p-0">
            <div>
              <h2 className="text-base font-semibold text-navy-900">Assign your tenant</h2>
              <p className="mt-0.5 text-xs text-neutral-600">
                If your tenant is already on ResiGrid, link them to this unit. Otherwise
                skip and invite them later.
              </p>
            </div>
            <TenantSearchInput
              label="Search for your tenant"
              onSelect={setSelectedTenant}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAssignTenant}
                disabled={!selectedTenant || !unitId || assigning}
                className="flex-1"
              >
                {assigning ? "Assigning…" : "Assign tenant"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep("done")}
                className="flex-1"
              >
                Skip for now
              </Button>
            </div>
            {assignError && <p className="text-sm text-red-600">{assignError}</p>}
          </CardContent>
        </Card>
      )}

      {step === "done" && (
        <Card className="p-6">
          <CardContent className="flex flex-col items-center gap-4 p-0 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <div>
              <h2 className="text-lg font-bold text-navy-900">You&apos;re all set!</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Your property portal is ready. Here&apos;s what to do next:
              </p>
            </div>

            <div className="w-full space-y-2">
              <NextStep
                icon={FileText}
                label="Create a lease"
                description="Build a digital lease your tenant can sign from their portal"
                href={`/pm/leases/new${propertyId ? `?propertyId=${propertyId}` : ""}`}
              />
              <NextStep
                icon={User}
                label="Manage tenants"
                description="View all tenants and their payment history"
                href="/pm/tenants"
              />
              <NextStep
                icon={LayoutDashboard}
                label="Go to dashboard"
                description="See your full property management overview"
                href="/pm/dashboard"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NextStep({
  icon: Icon,
  label,
  description,
  href,
}: {
  icon: typeof Building2;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-left transition-shadow hover:shadow-sm"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-900/5 text-navy-900">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-navy-900">{label}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-neutral-400" />
    </a>
  );
}
