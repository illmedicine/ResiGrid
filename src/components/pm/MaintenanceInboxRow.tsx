"use client";

import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { ChevronDown, ChevronUp } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { useUserDisplayName } from "@/lib/hooks/useUserDisplayName";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { MaintenanceDMThread } from "@/components/shared/MaintenanceDMThread";
import { RGEBadgeChip } from "@/components/shared/RGEBadgeChip";
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
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const tenantName = useUserDisplayName(request.tenantId);

  // Backfill pmId on legacy requests that pre-date this field
  useEffect(() => {
    if (!user || request.pmId) return;
    updateDoc(doc(db, "maintenanceRequests", request.id), { pmId: user.uid }).catch(() => {});
  }, [request.id, request.pmId, user]);

  async function handleStatusChange(status: MaintenanceStatus) {
    setStatusError(null);
    try {
      await updateDoc(doc(db, "maintenanceRequests", request.id), { status });
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-navy-900">
                {request.category} — {request.item}
              </p>
              {tenantName && <RGEBadgeChip tenantId={request.tenantId} />}
            </div>
            {tenantName && <p className="text-xs text-neutral-500">{tenantName}</p>}
            {request.affectedRoom && (
              <p className="text-xs text-neutral-500">Room: {request.affectedRoom}</p>
            )}
            <p className="text-xs text-neutral-600">
              {new Date(request.createdAt).toLocaleDateString()} · {request.priority} priority
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge tone={statusTone[request.status]}>
              {request.status.replace(/_/g, " ")}
            </Badge>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-neutral-400 hover:text-navy-900"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-600 whitespace-pre-wrap">{request.description}</p>

        {/* ── Status selector ── */}
        <div className="flex flex-col gap-1">
          <Select
            value={request.status}
            onChange={(e) => handleStatusChange(e.target.value as MaintenanceStatus)}
            className="w-fit text-xs"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </Select>
          {statusError && <p className="text-xs text-red-600">{statusError}</p>}
        </div>

        {/* ── Expanded detail ── */}
        {expanded && (
          <div className="flex flex-col gap-4 border-t border-neutral-100 pt-3">
            {/* Photos */}
            {request.photoUrls?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-neutral-500">Photos</p>
                <div className="flex flex-wrap gap-2">
                  {request.photoUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="h-24 w-24 rounded-lg object-cover ring-1 ring-neutral-200 transition hover:ring-orange-400"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* DM thread with tenant */}
            {user && (
              <MaintenanceDMThread
                requestId={request.id}
                currentUserId={user.uid}
                otherPartyLabel="Tenant"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
