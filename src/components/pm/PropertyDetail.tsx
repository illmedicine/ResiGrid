"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { Camera, Plus } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { listingsCol } from "@/lib/firebase/firestore";
import { useUnitsForProperty } from "@/lib/hooks/useUnitsForProperty";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AddUnitForm } from "@/components/pm/AddUnitForm";
import { UnitRow } from "@/components/pm/UnitRow";
import { PhotoUpload } from "@/components/pm/PhotoUpload";
import type { ListingDoc, PropertyDoc } from "@/lib/types/models";

export function PropertyDetail({ propertyId }: { propertyId: string }) {
  const [property, setProperty] = useState<PropertyDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const { units, loading: unitsLoading } = useUnitsForProperty(propertyId);
  const [showForm, setShowForm] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [propertyListings, setPropertyListings] = useState<ListingDoc[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "properties", propertyId), (snap) => {
      const data = snap.exists() ? (snap.data() as PropertyDoc) : null;
      setProperty(data);
      if (data) setPhotos(data.photos ?? []);
      setLoading(false);
    });
    return unsub;
  }, [propertyId]);

  useEffect(() => {
    const q = query(listingsCol(), where("propertyId", "==", propertyId));
    return onSnapshot(q, (snap) => {
      setPropertyListings(
        snap.docs
          .map((d) => d.data())
          .filter((l) => l.status === "published" || l.status === "draft"),
      );
    });
  }, [propertyId]);

  async function handleSavePhotos(urls: string[]) {
    setPhotos(urls);
    setSavingPhotos(true);
    try {
      await updateDoc(doc(db, "properties", propertyId), { photos: urls });
    } finally {
      setSavingPhotos(false);
    }
  }

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

      {/* Property photos */}
      <Card className="p-5">
        <CardContent className="p-0 flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Camera className="h-4 w-4 text-orange-500" />
            Property photos
            {savingPhotos && <span className="text-xs font-normal text-neutral-400">Saving…</span>}
          </h2>
          <p className="text-xs text-neutral-500">
            These photos appear on your tenants&apos; My Home dashboard. Upload high-quality photos — the first is the hero image.
          </p>
          <PhotoUpload
            storagePath={`resigrid/properties/${propertyId}`}
            uploadedUrls={photos}
            onChange={handleSavePhotos}
            maxPhotos={12}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy-900">
          Units
          <span className="ml-2 text-xs font-normal text-neutral-500">
            {units.length} / 20
          </span>
        </h2>
        <Button size="sm" onClick={() => setShowForm((v) => !v)} disabled={units.length >= 20}>
          <Plus className="h-4 w-4" />
          Add unit
        </Button>
      </div>
      {units.length >= 20 && (
        <p className="text-xs text-amber-600">
          20-unit limit reached. Contact support to expand your property.
        </p>
      )}

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
          {units.map((unit) => {
            const activeListing = propertyListings.find((l) => l.unitId === unit.id);
            return <UnitRow key={unit.id} unit={unit} property={property} activeListing={activeListing} />;
          })}
        </div>
      )}
    </div>
  );
}
