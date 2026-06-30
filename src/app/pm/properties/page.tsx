"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { useOwnerProperties } from "@/lib/hooks/useOwnerProperties";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PropertyCard } from "@/components/pm/PropertyCard";
import { AddPropertyForm } from "@/components/pm/AddPropertyForm";

export default function PmPropertiesPage() {
  const { user } = useAuth();
  const { properties, loading } = useOwnerProperties(user?.uid);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Properties</h1>
          <p className="text-sm text-neutral-600">
            Manage your properties and units.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          Add property
        </Button>
      </div>

      {showForm && user && (
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
              No properties yet. Add your first property to get started.
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
