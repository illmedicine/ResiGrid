"use client";

import { useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { useOwnerProperties } from "@/lib/hooks/useOwnerProperties";
import { usePMSubscription } from "@/lib/hooks/usePMSubscription";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PropertyCard } from "@/components/pm/PropertyCard";
import { AddPropertyForm } from "@/components/pm/AddPropertyForm";

const NEXT_TIER: Record<string, { name: string; href: string }> = {
  starter: { name: "Growth Grid", href: "/pricing" },
  growth: { name: "Mega Grid", href: "/pricing" },
};

export default function PmPropertiesPage() {
  const { user } = useAuth();
  const { properties, loading } = useOwnerProperties(user?.uid);
  const { tierConfig } = usePMSubscription(user?.uid);
  const [showForm, setShowForm] = useState(false);

  // Portal access pausing is disabled — PMs can always add properties.
  const canAddFree = true;

  const maxProperties = tierConfig?.maxProperties ?? null; // null = unlimited (Mega)
  const atPropertyLimit = maxProperties !== null && properties.length >= maxProperties;

  const totalUnits = properties.reduce((sum, p) => sum + (p.unitIds?.length ?? 0), 0);
  const maxTotalUnits = tierConfig?.maxTotalUnits ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Properties</h1>
          <p className="text-sm text-neutral-600">
            {tierConfig ? (
              <>
                <span className="font-medium text-orange-600">{tierConfig.name}</span>
                {" · "}
                {maxProperties !== null
                  ? `${properties.length} / ${maxProperties} propert${maxProperties === 1 ? "y" : "ies"}`
                  : `${properties.length} propert${properties.length !== 1 ? "ies" : "y"}`}
                {maxTotalUnits !== null && (
                  <> · {totalUnits} / {maxTotalUnits} units total</>
                )}
              </>
            ) : (
              "Manage your properties and units."
            )}
          </p>
        </div>

        {canAddFree && !atPropertyLimit ? (
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            Add property
          </Button>
        ) : canAddFree && atPropertyLimit ? (
          <Button size="sm" variant="outline" href="/pricing">
            <ArrowUpRight className="h-4 w-4" />
            Upgrade plan
          </Button>
        ) : (
          <Button href="/pm/checkout?action=add" size="sm">
            <Plus className="h-4 w-4" />
            Add property
          </Button>
        )}
      </div>

      {/* Tier limit reached banner */}
      {canAddFree && atPropertyLimit && tierConfig && (
        <Card className="border-orange-200 bg-orange-50 p-4">
          <CardContent className="flex items-start justify-between gap-4 p-0">
            <div>
              <p className="text-sm font-semibold text-navy-900">
                {tierConfig.name} limit reached
              </p>
              <p className="mt-0.5 text-xs text-neutral-600">
                Your plan supports {maxProperties} propert{maxProperties === 1 ? "y" : "ies"}.
                {NEXT_TIER[tierConfig.id] && (
                  <> Upgrade to <strong>{NEXT_TIER[tierConfig.id].name}</strong> to add more.</>
                )}
              </p>
            </div>
            {NEXT_TIER[tierConfig.id] && (
              <Badge tone="warning">{tierConfig.name}</Badge>
            )}
          </CardContent>
        </Card>
      )}

      {showForm && user && canAddFree && !atPropertyLimit && (
        <Card className="p-5">
          <CardContent className="p-0">
            <AddPropertyForm
              ownerId={user.uid}
              onCreated={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : properties.length === 0 ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">
              No properties yet. Click <strong>Add property</strong> to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
