"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { FileText } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { useActiveLease } from "@/lib/hooks/useActiveLease";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function TenantLeasePage() {
  const { user } = useAuth();
  const { lease, loading } = useActiveLease(user?.uid);
  const [signing, setSigning] = useState(false);

  async function handleSign() {
    if (!lease) return;
    setSigning(true);
    try {
      const nextStatus =
        lease.signedStatus === "unsigned" ? "tenant_signed" : lease.signedStatus;
      await updateDoc(doc(db, "leases", lease.id), {
        signedStatus: nextStatus,
      });
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Lease</h1>
        <p className="text-sm text-neutral-600">
          View and sign your current lease agreement.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : !lease ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">
              You don&apos;t have a lease on file yet. Once a property
              manager assigns you to a unit, your lease will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-5">
          <CardContent className="flex flex-col gap-3 p-0">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                <FileText className="h-4 w-4" /> Lease agreement
              </span>
              <Badge
                tone={lease.signedStatus === "fully_signed" ? "success" : "warning"}
              >
                {lease.signedStatus.replace("_", " ")}
              </Badge>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-neutral-600">Rent</dt>
                <dd className="font-medium text-navy-900">
                  ${lease.rentAmount.toLocaleString()}/mo
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">Due day</dt>
                <dd className="font-medium text-navy-900">{lease.dueDay}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">Start date</dt>
                <dd className="font-medium text-navy-900">
                  {new Date(lease.startDate).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-600">End date</dt>
                <dd className="font-medium text-navy-900">
                  {new Date(lease.endDate).toLocaleDateString()}
                </dd>
              </div>
            </dl>
            {lease.documentUrl && (
              <a
                href={lease.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-orange-600"
              >
                View lease document →
              </a>
            )}
            {lease.signedStatus === "unsigned" && (
              <Button onClick={handleSign} disabled={signing} className="w-fit">
                {signing ? "Signing…" : "Sign lease"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
