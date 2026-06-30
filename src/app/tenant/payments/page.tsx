"use client";

import { useAuth } from "@/lib/firebase/hooks";
import { ReputationSummary } from "@/components/tenant/ReputationSummary";
import { PaymentHistoryList } from "@/components/tenant/PaymentHistoryList";

export default function TenantPaymentsPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Payment history</h1>
        <p className="text-sm text-neutral-600">
          Your full record of on-time and late payments.
        </p>
      </div>
      {user && (
        <>
          <ReputationSummary tenantId={user.uid} />
          <PaymentHistoryList tenantId={user.uid} />
        </>
      )}
    </div>
  );
}
