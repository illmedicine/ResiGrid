"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { paymentsCol } from "@/lib/firebase/firestore";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { PaymentDoc } from "@/lib/types/models";

export function PaymentHistoryList({ tenantId }: { tenantId: string }) {
  const [payments, setPayments] = useState<PaymentDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      paymentsCol(),
      where("tenantId", "==", tenantId),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPayments(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [tenantId]);

  if (loading) {
    return <p className="text-sm text-neutral-600">Loading payment history…</p>;
  }

  if (payments.length === 0) {
    return (
      <Card className="p-5">
        <CardContent className="p-0">
          <p className="text-sm text-neutral-600">
            No payments yet. Once you pay rent through ResiGrid, your history
            will show up here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {payments.map((payment) => (
        <Card key={payment.id} className="p-4">
          <CardContent className="flex items-center justify-between p-0">
            <div>
              <p className="text-sm font-semibold text-navy-900">
                ${payment.amount.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-600">
                {payment.paidDate
                  ? new Date(payment.paidDate).toLocaleDateString()
                  : "Pending"}
              </p>
            </div>
            <Badge
              tone={
                payment.status === "completed"
                  ? payment.onTime
                    ? "success"
                    : "warning"
                  : payment.status === "failed"
                    ? "danger"
                    : "neutral"
              }
            >
              {payment.status === "completed"
                ? payment.onTime
                  ? "On time"
                  : "Late"
                : payment.status}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
