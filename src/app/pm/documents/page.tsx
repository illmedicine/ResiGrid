"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, deleteDoc, doc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { ClipboardList, FileEdit, FileText, FolderOpen, Loader2, Trash2, Upload } from "lucide-react";
import { storage } from "@/lib/firebase/config";
import {
  applicationFormsCol,
  applicationsCol,
  leaseTemplatesCol,
  leaseTermsCol,
  sharedDocumentsCol,
} from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type {
  ApplicationDoc,
  ApplicationFormDoc,
  LeaseTemplateDoc,
  LeaseTermsDoc,
  SharedDocumentDoc,
} from "@/lib/types/models";

const UPLOAD_CATEGORIES = ["lease", "application", "maintenance", "other"] as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmt(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
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

export default function PmDocumentsPage() {
  const { user } = useAuth();
  const [sharedDocs, setSharedDocs] = useState<SharedDocumentDoc[]>([]);
  const [leases, setLeases] = useState<LeaseTermsDoc[]>([]);
  const [applications, setApplications] = useState<ApplicationDoc[]>([]);
  const [leaseTpls, setLeaseTpls] = useState<LeaseTemplateDoc[]>([]);
  const [appForms, setAppForms] = useState<ApplicationFormDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<(typeof UPLOAD_CATEGORIES)[number]>("other");
  const [tenantId, setTenantId] = useState("");
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
      onSnapshot(query(sharedDocumentsCol(), where("pmId", "==", uid)), (snap) => {
        setSharedDocs(
          snap.docs.map((d) => ({ ...d.data(), id: d.id } as SharedDocumentDoc))
            .sort((a, b) => b.createdAt - a.createdAt),
        );
        tryDone();
      }, tryDone),
    );

    unsubs.push(
      onSnapshot(query(leaseTermsCol(), where("pmId", "==", uid)), (snap) => {
        setLeases(
          snap.docs.map((d) => ({ ...d.data(), id: d.id } as LeaseTermsDoc))
            .sort((a, b) => b.createdAt - a.createdAt),
        );
        tryDone();
      }, tryDone),
    );

    unsubs.push(
      onSnapshot(query(applicationsCol(), where("pmId", "==", uid)), (snap) => {
        setApplications(
          snap.docs.map((d) => ({ ...d.data(), id: d.id } as ApplicationDoc))
            .filter((a) => ["submitted", "under_review", "approved", "denied"].includes(a.status))
            .sort((a, b) => b.submittedAt - a.submittedAt),
        );
        tryDone();
      }, tryDone),
    );

    getDocs(query(leaseTemplatesCol(), where("pmId", "==", uid))).then((snap) =>
      setLeaseTpls(
        snap.docs.map((d) => ({ ...d.data(), id: d.id } as LeaseTemplateDoc))
          .sort((a, b) => b.createdAt - a.createdAt),
      ),
    ).catch(() => {});

    getDocs(query(applicationFormsCol(), where("pmId", "==", uid))).then((snap) =>
      setAppForms(
        snap.docs.map((d) => ({ ...d.data(), id: d.id } as ApplicationFormDoc))
          .sort((a, b) => b.createdAt - a.createdAt),
      ),
    ).catch(() => {});

    return () => unsubs.forEach((u) => u());
  }, [user]);

  async function handleUpload(files: FileList | null) {
    if (!files || !user || !tenantId.trim()) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const path = `resigrid/documents/${user.uid}/${tenantId.trim()}/${Date.now()}-${file.name}`;
        const sRef = storageRef(storage, path);
        await uploadBytes(sRef, file);
        const url = await getDownloadURL(sRef);
        await addDoc(sharedDocumentsCol(), {
          id: "",
          uploaderId: user.uid,
          uploaderRole: "property_manager" as const,
          tenantId: tenantId.trim(),
          pmId: user.uid,
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
    await deleteDoc(doc(sharedDocumentsCol(), d.id));
  }

  const sentLeases = leases.filter((l) => l.status !== "draft");
  const tenantDocs = sharedDocs.filter((d) => d.uploaderRole === "tenant");
  const myDocs = sharedDocs.filter((d) => d.uploaderRole === "property_manager");
  const isEmpty = sentLeases.length === 0 && applications.length === 0 && sharedDocs.length === 0 && leaseTpls.length === 0 && appForms.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Documents</h1>
        <p className="text-sm text-neutral-600">Lease agreements, applications, templates, and shared files.</p>
      </div>

      {/* Upload */}
      <Card className="p-5">
        <CardContent className="flex flex-col gap-4 p-0">
          <h2 className="text-sm font-semibold text-navy-900">Share a document with a tenant</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Tenant UID</label>
              <input
                type="text"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="Paste tenant UID…"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
            >
              {UPLOAD_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </Select>
          </div>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading || !tenantId.trim()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Choose files to upload"}
          </Button>
          {!tenantId.trim() && <p className="text-xs text-neutral-500">Enter a tenant UID to enable upload.</p>}
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : isEmpty ? (
        <Card className="p-8">
          <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
            <FolderOpen className="h-10 w-10 text-neutral-300" />
            <p className="text-sm text-neutral-600">No documents yet. Send a lease or upload a document above.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Lease Agreements */}
          {sentLeases.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-navy-900">Lease Agreements</h2>
              {sentLeases.map((lease) => (
                <Card key={lease.id} className="p-4">
                  <CardContent className="flex items-center justify-between gap-3 p-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 shrink-0 text-orange-500" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900">
                          {lease.tenantName || lease.tenantEmail}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {lease.termType} · Sent {fmt(lease.sentAt)}
                          {lease.viewedAt ? ` · Viewed ${fmt(lease.viewedAt)}` : ""}
                        </p>
                        {lease.tenantSignedAt && (
                          <p className="text-xs text-green-600">Signed {fmt(lease.tenantSignedAt)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone={LEASE_TONE[lease.status] ?? "neutral"}>
                        {lease.status.replace("_", " ")}
                      </Badge>
                      <Button size="sm" variant="outline" href={`/pm/leases/view?id=${lease.id}`}>
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {/* Applications */}
          {applications.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-navy-900">Applications</h2>
              {applications.map((app) => (
                <Card key={app.id} className="p-4">
                  <CardContent className="flex items-center justify-between gap-3 p-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <ClipboardList className="h-5 w-5 shrink-0 text-blue-500" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900">
                          Applicant <span className="font-mono text-xs text-neutral-500">{app.tenantId.slice(0, 8)}…</span>
                        </p>
                        <p className="text-xs text-neutral-500">Submitted {fmt(app.submittedAt)}</p>
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

          {/* Documents from tenants */}
          {tenantDocs.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-navy-900">Documents from Tenants</h2>
              {tenantDocs.map((d) => (
                <Card key={d.id} className="p-4">
                  <CardContent className="flex items-center gap-3 p-0">
                    <FileText className="h-5 w-5 shrink-0 text-blue-500" />
                    <div className="min-w-0 flex-1">
                      <a href={d.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium text-navy-900 hover:text-orange-600">
                        {d.name}
                      </a>
                      <p className="text-xs text-neutral-500">
                        {d.category} · {formatBytes(d.sizeBytes)} · Tenant: {d.tenantId.slice(0, 8)}… · {fmt(d.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {/* Lease templates */}
          {leaseTpls.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-navy-900">Lease Templates</h2>
              {leaseTpls.map((tpl) => (
                <Card key={tpl.id} className="p-4">
                  <CardContent className="flex items-center justify-between gap-3 p-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileEdit className="h-5 w-5 shrink-0 text-purple-500" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900">{tpl.name}</p>
                        <p className="text-xs text-neutral-500">{tpl.termType} · Created {fmt(tpl.createdAt)}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" href="/pm/leases/new">Use template</Button>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {/* Application form templates */}
          {appForms.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-navy-900">Application Forms</h2>
              {appForms.map((form) => (
                <Card key={form.id} className="p-4">
                  <CardContent className="flex items-center justify-between gap-3 p-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <ClipboardList className="h-5 w-5 shrink-0 text-teal-500" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900">{form.name}</p>
                        <p className="text-xs text-neutral-500">Application form · Created {fmt(form.createdAt)}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" href="/pm/application-forms">View forms</Button>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {/* Shared by me */}
          {myDocs.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-navy-900">Shared by Me</h2>
              {myDocs.map((d) => (
                <Card key={d.id} className="p-4">
                  <CardContent className="flex items-center justify-between gap-3 p-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 shrink-0 text-orange-500" />
                      <div className="min-w-0">
                        <a href={d.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium text-navy-900 hover:text-orange-600">
                          {d.name}
                        </a>
                        <p className="text-xs text-neutral-500">
                          {d.category} · {formatBytes(d.sizeBytes)} · Tenant: {d.tenantId.slice(0, 8)}… · {fmt(d.createdAt)}
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
        </>
      )}
    </div>
  );
}
