"use client";

import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import type { MaintenanceRequestDoc, MaintenanceStatus } from "@/lib/types/models";

const statusTone: Record<MaintenanceStatus, "neutral" | "warning" | "success" | "navy"> = {
  submitted: "neutral",
  acknowledged: "navy",
  in_progress: "warning",
  resolved: "success",
  closed: "neutral",
};

const STATUS_OPTIONS: MaintenanceStatus[] = [
  "submitted",
  "acknowledged",
  "in_progress",
  "resolved",
  "closed",
];

export function MaintenanceInboxRow({ request }: { request: MaintenanceRequestDoc }) {
  async function handleStatusChange(status: MaintenanceStatus) {
    await updateDoc(doc(db, "maintenanceRequests", request.id), { status });
  }

  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-2 p-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-navy-900">
            {request.category} — {request.item}
          </p>
          <Badge tone={statusTone[request.status]}>
            {request.status.replace("_", " ")}
          </Badge>
        </div>
        <p className="text-xs text-neutral-600">{request.description}</p>
        <p className="text-xs text-neutral-600">
          {new Date(request.createdAt).toLocaleDateString()} · {request.priority}{" "}
          priority
        </p>
        <Select
          value={request.status}
          onChange={(e) => handleStatusChange(e.target.value as MaintenanceStatus)}
          className="w-fit"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ")}
            </option>
          ))}
        </Select>
      </CardContent>
    </Card>
  );
}
