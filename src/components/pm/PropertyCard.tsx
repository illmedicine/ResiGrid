"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { arrayRemove, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { Building2, MapPin, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { unitsCol } from "@/lib/firebase/firestore";
import { Card, CardContent } from "@/components/ui/Card";
import type { PropertyDoc } from "@/lib/types/models";

export function PropertyCard({ property }: { property: PropertyDoc }) {
  const { user } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasRealUnits, setHasRealUnits] = useState(property.unitIds.length > 0);

  // Don't trust property.unitIds alone — it can desync from the real units
  // collection (this is exactly what let a property with a real occupied
  // unit get deleted while it incorrectly looked empty). Verify live.
  useEffect(() => {
    let cancelled = false;
    getDocs(query(unitsCol(), where("propertyId", "==", property.id))).then((snap) => {
      if (!cancelled) setHasRealUnits(!snap.empty);
    });
    return () => { cancelled = true; };
  }, [property.id]);

  const canDelete = !hasRealUnits;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!user) return;
    setDeleting(true);
    try {
      const realUnits = await getDocs(query(unitsCol(), where("propertyId", "==", property.id)));
      if (!realUnits.empty) {
        setHasRealUnits(true);
        setDeleting(false);
        setConfirm(false);
        return;
      }
      await deleteDoc(doc(db, "properties", property.id));
      await updateDoc(doc(db, "propertyManagers", user.uid), {
        propertyIds: arrayRemove(property.id),
      });
    } catch {
      setDeleting(false);
      setConfirm(false);
    }
  }

  return (
    <div className="relative">
      <Link href={`/pm/properties/view/?id=${property.id}`}>
        <Card className="p-4 transition-shadow hover:shadow-md">
          <CardContent className="flex items-start gap-3 p-0">
            <span className="rounded-lg bg-navy-900/5 p-2 text-navy-900">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy-900">{property.name}</p>
              <p className="flex items-center gap-1 text-xs text-neutral-600">
                <MapPin className="h-3.5 w-3.5" />
                {property.addressLine1}, {property.city}, {property.state}
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                {property.unitIds.length} unit{property.unitIds.length === 1 ? "" : "s"}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>

      {canDelete && (
        <div className="absolute right-2 top-2" onClick={(e) => e.preventDefault()}>
          {!confirm ? (
            <button
              type="button"
              title="Delete property"
              onClick={() => setConfirm(true)}
              className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 shadow-sm">
              <span className="text-xs text-red-600">Delete?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "…" : "Yes"}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="rounded border border-neutral-300 px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-50"
              >
                No
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
