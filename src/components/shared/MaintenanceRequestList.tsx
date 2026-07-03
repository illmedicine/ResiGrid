"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { maintenanceRequestsCol } from "@/lib/firebase/firestore";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MaintenanceDMThread } from "@/components/shared/MaintenanceDMThread";
import type { MaintenanceRequestDoc, MaintenanceStatus } from "@/lib/types/models";

const statusTone: Record<MaintenanceStatus, "neutral" | "warning" | "success" | "navy"> = {
  submitted: "neutral",
  acknowledged: "navy",
  in_progress: "warning",
  resolved: "success",
  closed: "neutral",
};

interface Props {
  scope: "tenant" | "property";
  scopeId: string;
}

function RequestRow({ req }: { req: MaintenanceRequestDoc }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-2 p-0">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-navy-900">{req.category} — {req.item}</p>
            {req.affectedRoom && <p className="text-xs text-neutral-500">Room: {req.affectedRoom}</p>}
            <p className="text-xs text-neutral-600">
              {new Date(req.createdAt).toLocaleDateString()} · {req.priority} priority
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge tone={statusTone[req.status]}>{req.status.replace(/_/g, " ")}</Badge>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-neutral-400 hover:text-navy-900"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-600 whitespace-pre-wrap">{req.description}</p>

        {/* ── Expanded ── */}
        {expanded && (
          <div className="flex flex-col gap-4 border-t border-neutral-100 pt-3">
            {/* Photos */}
            {req.photoUrls?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-neutral-500">Photos</p>
                <div className="flex flex-wrap gap-2">
                  {req.photoUrls.map((url, i) => (
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

            {/* DM thread with property manager */}
            {user && (
              <MaintenanceDMThread
                requestId={req.id}
                currentUserId={user.uid}
                otherPartyLabel="Property Manager"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MaintenanceRequestList({ scope, scopeId }: Props) {
  const [requests, setRequests] = useState<MaintenanceRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const field = scope === "tenant" ? "tenantId" : "propertyId";
    const q = query(maintenanceRequestsCol(), where(field, "==", scopeId));
    return onSnapshot(
      q,
      (snap) => {
        setRequests(
          snap.docs
            .map((d) => ({ ...d.data(), id: d.id } as MaintenanceRequestDoc))
            .sort((a, b) => b.createdAt - a.createdAt),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [scope, scopeId]);

  if (loading) return <p className="text-sm text-neutral-600">Loading requests…</p>;
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
      {requests.map((req) => <RequestRow key={req.id} req={req} />)}
    </div>
  );
}
