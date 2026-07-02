"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { ChevronDown, ChevronUp, Send } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
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

/** Find an existing PM↔tenant thread or create one for this maintenance request. */
async function getOrCreateThread(
  pmId: string,
  tenantId: string,
  propertyId: string,
): Promise<string> {
  // Look for an existing thread between these two participants
  const threadsRef = collection(db, "messageThreads");
  const snap = await getDocs(
    query(threadsRef, where("participantIds", "array-contains", pmId)),
  );
  const existing = snap.docs.find((d) =>
    (d.data().participantIds as string[]).includes(tenantId),
  );
  if (existing) return existing.id;

  // Create a new thread
  const newRef = doc(threadsRef);
  await setDoc(newRef, {
    id: newRef.id,
    participantIds: [pmId, tenantId],
    propertyId,
    lastMessageAt: Date.now(),
    lastMessageSnippet: "",
  });
  return newRef.id;
}

export function MaintenanceInboxRow({ request }: { request: MaintenanceRequestDoc }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [pmNotes, setPmNotes] = useState(request.pmNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);

  // Keep textarea in sync when Firestore pushes an updated request prop
  useEffect(() => {
    if (!saving) setPmNotes(request.pmNotes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.pmNotes]);

  async function handleStatusChange(status: MaintenanceStatus) {
    setStatusError(null);
    try {
      await updateDoc(doc(db, "maintenanceRequests", request.id), { status });
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function handleSendNote() {
    if (!pmNotes.trim() || !user) return;
    setSaving(true);
    setNotesError(null);
    try {
      const now = Date.now();

      // 1. Save pm note to the maintenance request doc
      await updateDoc(doc(db, "maintenanceRequests", request.id), { pmNotes });

      // 2. Send as a real message in the PM↔tenant thread
      const threadId = await getOrCreateThread(
        user.uid,
        request.tenantId,
        request.propertyId,
      );

      const msgRef = doc(collection(db, "messageThreads", threadId, "messages"));
      await setDoc(msgRef, {
        id: msgRef.id,
        threadId,
        senderId: user.uid,
        content: `[Maintenance update] ${pmNotes}`,
        createdAt: now,
        readBy: [user.uid],
      });

      // 3. Update thread preview
      await updateDoc(doc(db, "messageThreads", threadId), {
        lastMessageAt: now,
        lastMessageSnippet: `Maintenance update: ${pmNotes.slice(0, 60)}`,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : "Failed to send note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-navy-900">
              {request.category} — {request.item}
            </p>
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
          <div className="flex flex-col gap-3 border-t border-neutral-100 pt-3">
            {/* Photos */}
            {request.photoUrls?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-neutral-500">Photos</p>
                <div className="grid grid-cols-3 gap-2">
                  {request.photoUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tenant note */}
            {request.tenantNotes && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                <p className="mb-0.5 text-xs font-medium text-blue-700">Tenant note</p>
                <p className="text-xs text-blue-800 whitespace-pre-wrap">{request.tenantNotes}</p>
              </div>
            )}

            {/* PM reply / note */}
            <div>
              <p className="mb-1 text-xs font-medium text-neutral-700">
                Reply to tenant
                <span className="ml-1 font-normal text-neutral-400">
                  — saves to this request &amp; sends a direct message
                </span>
              </p>
              <textarea
                value={pmNotes}
                onChange={(e) => { setPmNotes(e.target.value); setSaved(false); }}
                rows={3}
                placeholder="Type an update for the tenant — they'll receive it as a direct message…"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              <div className="mt-1.5 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSendNote}
                  disabled={saving || !pmNotes.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                  {saved ? "Sent!" : saving ? "Sending…" : "Send note"}
                </Button>
                {saved && (
                  <span className="text-xs text-green-600">
                    Note saved &amp; message delivered to tenant
                  </span>
                )}
              </div>
              {notesError && (
                <p className="mt-1 text-xs text-red-600">{notesError}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
