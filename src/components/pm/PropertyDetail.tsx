"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { Plus } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { useUnitsForProperty } from "@/lib/hooks/useUnitsForProperty";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AddUnitForm } from "@/components/pm/AddUnitForm";
import { UnitRow } from "@/components/pm/UnitRow";
import type { PropertyDoc } from "@/lib/types/models";

export function PropertyDetail({ propertyId }: { propertyId: string }) {
  const [property, setProperty] = useState<PropertyDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const { units, loading: unitsLoading } = useUnitsForProperty(propertyId);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "properties", propertyId), (snap) => {
      setProperty(snap.exists() ? (snap.data() as PropertyDoc) : null);
      setLoading(false);
    });
    return unsub;
  }, [propertyId]);

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>;
  if (!property) return <p className="text-sm text-neutral-600">Property not found.</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">{property.name}</h1>
        <p className="text-sm text-neutral-600">
          {property.addressLine1}, {property.city}, {property.state}{" "}
          {property.zip}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy-900">Units</h2>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          Add unit
        </Button>
      </div>

      {showForm && (
        <Card className="p-5">
          <CardContent className="p-0">
            <AddUnitForm
              propertyId={property.id}
              onCreated={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {unitsLoading ? (
        <p className="text-sm text-neutral-600">Loading units…</p>
      ) : units.length === 0 ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">No units yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {units.map((unit) => (
            <UnitRow key={unit.id} unit={unit} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
