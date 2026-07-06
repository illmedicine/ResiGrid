"use client";

import { useEffect, useState } from "react";
import { limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { rentInvoicesCol } from "@/lib/firebase/firestore";
import type { RentInvoiceDoc } from "@/lib/types/models";

const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;

export function computeCycleDueDate(startDate: number, cycleNumber: number): number {
  return startDate + cycleNumber * MS_30_DAYS;
}

function currentCycleNumber(startDate: number, now: number): number {
  return Math.max(1, Math.floor((now - startDate) / MS_30_DAYS) + 1);
}

/**
 * Latest rent invoice for a lease. If the daily cycle-generation function
 * hasn't run yet for the current cycle, falls back to a client-computed
 * due date so the counter is never blank.
 */
export function useCurrentRentInvoice(leaseTermsId: string | undefined, leaseStartDate: number | undefined) {
  const [invoice, setInvoice] = useState<RentInvoiceDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leaseTermsId) {
      setInvoice(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      rentInvoicesCol(),
      where("leaseTermsId", "==", leaseTermsId),
      orderBy("dueDate", "desc"),
      limit(1),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const doc = snap.docs[0];
        setInvoice(doc ? { ...doc.data(), id: doc.id } : null);
        setLoading(false);
      },
      () => {
        setInvoice(null);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [leaseTermsId]);

  if (invoice) {
    return { invoice, dueDate: invoice.dueDate, paid: invoice.status === "paid", loading };
  }

  if (!loading && leaseStartDate) {
    const cycle = currentCycleNumber(leaseStartDate, Date.now());
    return {
      invoice: null,
      dueDate: computeCycleDueDate(leaseStartDate, cycle),
      paid: false,
      loading: false,
    };
  }

  return { invoice: null, dueDate: null, paid: false, loading };
}
