"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { maintenanceRequestsCol } from "@/lib/firebase/firestore";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { MaintenanceRequestDoc, MaintenanceStatus } from "@/lib/types/models";

const statusTone: Record<MaintenanceStatus, "neutral" | "warning" | "success" | "navy"> = {
  submitted: "neutral",
  acknowledged: "navy",
  in_progress: "warning",
  resolved: "success",
  closed: "neutral",
};

interface MaintenanceRequestListProps {
  scope: "tenant" | "property";
  scopeId: string;
}

export function MaintenanceRequestList({
  scope,
  scopeId,
}: MaintenanceRequestListProps) {
  const [requests, setRequests] = useState<MaintenanceRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const field = scope === "tenant" ? "tenantId" : "propertyId";
    const q = query(
      maintenanceRequestsCol(),
      where(field, "==", scopeId),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRequests(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [scope, scopeId]);

  if (loading) {
    return <p className="text-sm text-neutral-600">Loading requests…</p>;
  }

  if (requests.length === 0) {
    return (
      <Card className="p-5">
        <CardContent className="p-0">
          <p className="text-sm text-neutral-600">No maintenance requests yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {requests.map((req) => (
        <Card key={req.id} className="p-4">
          <CardContent className="flex flex-col gap-1 p-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy-900">
                {req.category} — {req.item}
              </p>
              <Badge tone={statusTone[req.status]}>
                {req.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-xs text-neutral-600">{req.description}</p>
            <p className="text-xs text-neutral-600">
              {new Date(req.createdAt).toLocaleDateString()} · {req.priority}{" "}
              priority
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
