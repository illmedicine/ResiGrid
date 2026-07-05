"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { leaseTermsCol } from "@/lib/firebase/firestore";
import type { LeaseTermsDoc, PropertyDoc, UnitDoc } from "@/lib/types/models";

export interface TenantLease {
  lease: LeaseTermsDoc;
  property: PropertyDoc | null;
  unit: UnitDoc | null;
}

/**
 * A tenant can hold more than one signed lease at once (different properties/
 * units, even different PMs). This returns ALL of them — callers must not
 * collapse it back down to a single lease.
 */
export function useTenantLeases(tenantId: string | undefined) {
  const [leases, setLeases] = useState<TenantLease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      setLeases([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const q = query(
      leaseTermsCol(),
      where("tenantId", "==", tenantId),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      async (snap) => {
        const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as LeaseTermsDoc);
        const resolved = await Promise.all(
          docs.map(async (lease) => {
            const [propSnap, unitSnap] = await Promise.all([
              getDoc(doc(db, "properties", lease.propertyId)),
              getDoc(doc(db, "units", lease.unitId)),
            ]);
            return {
              lease,
              property: propSnap.exists()
                ? ({ ...propSnap.data(), id: propSnap.id } as PropertyDoc)
                : null,
              unit: unitSnap.exists() ? ({ ...unitSnap.data(), id: unitSnap.id } as UnitDoc) : null,
            };
          }),
        );
        if (cancelled) return;
        setLeases(resolved);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setLeases([]);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
      unsub();
    };
  }, [tenantId]);

  const activeLeases = leases.filter((l) => l.lease.status === "fully_signed");
  const pendingLeases = leases.filter((l) =>
    l.lease.status === "sent" || l.lease.status === "tenant_signed",
  );

  return { leases, activeLeases, pendingLeases, loading };
}
