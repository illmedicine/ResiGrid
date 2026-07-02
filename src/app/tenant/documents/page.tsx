"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { ClipboardList, FileText, FolderOpen, Loader2, Trash2, Upload } from "lucide-react";
import { storage } from "@/lib/firebase/config";
import { applicationsCol, leaseTermsCol, sharedDocumentsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { ApplicationDoc, LeaseTermsDoc, SharedDocumentDoc } from "@/lib/types/models";

const UPLOAD_CATEGORIES = ["lease", "application", "maintenance", "other"] as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmt(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtFull(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const LEASE_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  fully_signed: "success",
  tenant_signed: "warning",
  sent: "warning",
  draft: "neutral",
  expired: "danger",
};

const APP_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  submitted: "warning",
  under_review: "warning",
  approved: "success",
  denied: "danger",
};

export default function TenantDocumentsPage() {
  const { user } = useAuth();
  const [sharedDocs, setSharedDocs] = useState<SharedDocumentDoc[]>([]);
  const [leases, setLeases] = useState<LeaseTermsDoc[]>([]);
  const [applications, setApplications] = useState<ApplicationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<(typeof UPLOAD_CATEGORIES)[number]>("other");
  const [pmId, setPmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    let resolved = 0;
    const unsubs: (() => void)[] = [];

    function tryDone() {
      resolved++;
      if (resolved >= 3) setLoading(false);
    }

    unsubs.push(
      onSnapshot(query(sharedDocumentsCol(), where("tenantId", "==", uid)), (snap) => {
        setSharedDocs(
          snap.docs.map((d) => ({ ...d.data(), id: d.id } as SharedDocumentDoc))
            .sort((a, b) => b.createdAt - a.createdAt),
        );
        tryDone();
      }, tryDone),
    );

    unsubs.push(
      onSnapshot(query(leaseTermsCol(), where("tenantId", "==", uid)), (snap) => {
        const ls = snap.docs.map((d) => ({ ...d.data(), id: d.id } as LeaseTermsDoc))
          .sort((a, b) => b.createdAt - a.createdAt);
        setLeases(ls);
        if (ls.length > 0 && ls[0].pmId) setPmId(ls[0].pmId);
        tryDone();
      }, tryDone),
    );

    unsubs.push(
      onSnapshot(query(applicationsCol(), where("tenantId", "==", uid)), (snap) => {
        setApplications(
          snap.docs.map((d) => ({ ...d.data(), id: d.id } as ApplicationDoc))
            .filter((a) => ["submitted", "under_review", "approved", "denied"].includes(a.status))
            .sort((a, b) => b.submittedAt - a.submittedAt),
        );
        tryDone();
      }, tryDone),
    );

    return () => unsubs.forEach((u) => u());
  }, [user]);

  async function handleUpload(files: FileList | null) {
    if (!files || !user) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const path = `documents/tenant/${user.uid}/${Date.now()}-${file.name}`;
        const sRef = storageRef(storage, path);
        await uploadBytes(sRef, file);
        const url = await getDownloadURL(sRef);
        await addDoc(sharedDocumentsCol(), {
          id: "",
          uploaderId: user.uid,
          uploaderRole: "tenant" as const,
          tenantId: user.uid,
          pmId: pmId ?? "unassigned",
          name: file.name,
          url,
          mimeType: file.type,
          sizeBytes: file.size,
          category,
          createdAt: Date.now(),
        });
      } catch {
        // continue
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(d: SharedDocumentDoc) {
    if (d.uploaderId !== user?.uid) return;
    await deleteDoc(doc(sharedDocumentsCol(), d.id));
  }

  const fromPM = sharedDocs.filter((d) => d.uploaderRole === "property_manager");
  const fromMe = sharedDocs.filter((d) => d.uploaderRole === "tenant");
  const isEmpty = leases.length === 0 && applications.length === 0 && sharedDocs.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Documents</h1>
        <p className="text-sm text-neutral-600">Your signed agreements, applications, and shared files.</p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : (
        <>
          {/* Lease agreements */}
          {leases.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-navy-900">Lease Agreements</h2>
              {leases.map((lease) => (
                <Card key={lease.id} className="p-4">
                  <CardContent className="flex items-center justify-between gap-3 p-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 shrink-0 text-orange-500" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900">Lease Agreement</p>
                        <p className="text-xs text-neutral-500">
                          {lease.termType} · Starts {fmt(lease.startDate)}
                          {lease.endDate ? ` · Ends ${fmt(lease.endDate)}` : ""}
                        </p>
                        {lease.sentAt && (
                          <p className="text-xs text-neutral-500">Sent {fmtFull(lease.sentAt)}</p>
                        )}
                        {lease.tenantSignedAt && (
                          <p className="text-xs text-green-600 font-medium">
                            Signed by you {fmtFull(lease.tenantSignedAt)}
                          </p>
                        )}
                        {lease.status === "fully_signed" && (
                          <p className="text-xs text-green-700 font-semibold">Fully executed</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone={LEASE_TONE[lease.status] ?? "neutral"}>
                        {lease.status.replace("_", " ")}
                      </Badge>
                      {lease.status !== "draft" && (
                        <Button size="sm" variant="outline" href="/tenant/lease">View</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {/* Applications */}
          {applications.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-navy-900">My Applications</h2>
              {applications.map((app) => (
                <Card key={app.id} className="p-4">
                  <CardContent className="flex items-center justify-between gap-3 p-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <ClipboardList className="h-5 w-5 shrink-0 text-blue-500" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900">Rental Application</p>
                        <p className="text-xs text-neutral-500">Submitted {fmtFull(app.submittedAt)}</p>
                        {app.decidedAt && (
                          <p className="text-xs text-neutral-500">Decision {fmtFull(app.decidedAt)}</p>
                        )}
                        {app.decisionNote && (
                          <p className="text-xs text-neutral-600 mt-0.5 italic">{app.decisionNote}</p>
                        )}
                        {app.documentUrls && app.documentUrls.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {app.documentUrls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs text-orange-600 hover:underline">
                                Attachment {i + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge tone={APP_TONE[app.status] ?? "neutral"}>
                      {app.status.replace("_", " ")}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {/* From PM */}
          {fromPM.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-navy-900">From Your Property Manager</h2>
              {fromPM.map((d) => (
                <Card key={d.id} className="p-4">
                  <CardContent className="flex items-center gap-3 p-0">
                    <FileText className="h-5 w-5 shrink-0 text-orange-500" />
                    <div className="min-w-0 flex-1">
                      <a href={d.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium text-navy-900 hover:text-orange-600">
                        {d.name}
                      </a>
                      <p className="text-xs text-neutral-500">
                        {d.category} · {formatBytes(d.sizeBytes)} · {fmtFull(d.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {/* Upload */}
          <Card className="p-5">
            <CardContent className="flex flex-col gap-4 p-0">
              <h2 className="text-sm font-semibold text-navy-900">Upload a document</h2>
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-48"
              >
                {UPLOAD_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </Select>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Choose files"}
              </Button>
            </CardContent>
          </Card>

          {/* My uploads */}
          {fromMe.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-navy-900">Your Uploaded Documents</h2>
              {fromMe.map((d) => (
                <Card key={d.id} className="p-4">
                  <CardContent className="flex items-center justify-between gap-3 p-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 shrink-0 text-orange-500" />
                      <div className="min-w-0">
                        <a href={d.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium text-navy-900 hover:text-orange-600">
                          {d.name}
                        </a>
                        <p className="text-xs text-neutral-500">
                          {d.category} · {formatBytes(d.sizeBytes)} · {fmtFull(d.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleDelete(d)} className="shrink-0 text-neutral-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {/* Empty state */}
          {isEmpty && (
            <Card className="p-8">
              <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
                <FolderOpen className="h-10 w-10 text-neutral-300" />
                <p className="text-sm text-neutral-600">
                  No documents yet. Your signed leases and application records will appear here automatically.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
