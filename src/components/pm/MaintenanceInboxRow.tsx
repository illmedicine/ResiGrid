"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { db } from "@/lib/firebase/config";
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

const STATUS_OPTIONS: MaintenanceStatus[] = ["submitted", "acknowledged", "in_progress", "resolved", "closed"];

export function MaintenanceInboxRow({ request }: { request: MaintenanceRequestDoc }) {
  const [expanded, setExpanded] = useState(false);
  const [pmNotes, setPmNotes] = useState(request.pmNotes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  async function handleStatusChange(status: MaintenanceStatus) {
    await updateDoc(doc(db, "maintenanceRequests", request.id), { status });
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    await updateDoc(doc(db, "maintenanceRequests", request.id), { pmNotes });
    setSavingNotes(false);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-3 p-0">
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
            <Badge tone={statusTone[request.status]}>{request.status.replace(/_/g, " ")}</Badge>
            <button type="button" onClick={() => setExpanded((v) => !v)} className="text-neutral-400 hover:text-navy-900">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-600 whitespace-pre-wrap">{request.description}</p>

        <Select
          value={request.status}
          onChange={(e) => handleStatusChange(e.target.value as MaintenanceStatus)}
          className="w-fit text-xs"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </Select>

        {expanded && (
          <div className="flex flex-col gap-3 border-t border-neutral-100 pt-3">
            {request.photoUrls?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-neutral-500">Photos</p>
                <div className="grid grid-cols-3 gap-2">
                  {request.photoUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {request.tenantNotes && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                <p className="mb-0.5 text-xs font-medium text-blue-700">Tenant note</p>
                <p className="text-xs text-blue-800 whitespace-pre-wrap">{request.tenantNotes}</p>
              </div>
            )}

            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-neutral-400" />
                <p className="text-xs font-medium text-neutral-700">Your notes (visible to tenant)</p>
              </div>
              <textarea
                value={pmNotes}
                onChange={(e) => { setPmNotes(e.target.value); setNotesSaved(false); }}
                rows={3}
                placeholder="Add notes or updates for the tenant…"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              <Button size="sm" variant="outline" className="mt-1.5" onClick={handleSaveNotes} disabled={savingNotes}>
                {notesSaved ? "Saved!" : savingNotes ? "Saving…" : "Save notes"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
