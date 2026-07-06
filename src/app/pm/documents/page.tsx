"use client";

import { useEffect, useState } from "react";
import { deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { ClipboardList, FileText, FolderOpen, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { applicationsCol, leaseTermsCol, sharedDocumentsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useUserDisplayName } from "@/lib/hooks/useUserDisplayName";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ApplicationDoc, LeaseTermsDoc, SharedDocumentDoc } from "@/lib/types/models";

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

const APP_TONE: Record<string, "success" | "warning" | "danger" | "neutral" | "orange"> = {
  shortlisted: "orange",
  invited: "orange",
  submitted: "warning",
  under_review: "warning",
  more_info_needed: "orange",
  approved: "success",
  denied: "danger",
  withdrawn: "neutral",
};

export default function PmDocumentsPage() {
  const { user } = useAuth();
  const [sharedDocs, setSharedDocs] = useState<SharedDocumentDoc[]>([]);
  const [leases, setLeases] = useState<LeaseTermsDoc[]>([]);
  const [applications, setApplications] = useState<ApplicationDoc[]>([]);
  const [loading, setLoading] = useState(true);

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
            .sort((a, b) => b.submittedAt - a.submittedAt),
        );
        tryDone();
      }, tryDone),
    );

    return () => unsubs.forEach((u) => u());
  }, [user]);

  async function handleDeleteApplication(id: string) {
    await deleteDoc(doc(db, "applications", id));
  }
  async function handleDeleteLease(id: string) {
    await deleteDoc(doc(db, "leaseTerms", id));
  }
  async function handleDeleteSharedDoc(d: SharedDocumentDoc) {
    await deleteDoc(doc(sharedDocumentsCol(), d.id));
  }

  const sentLeases = leases.filter((l) => l.status !== "draft");
  const tenantDocs = sharedDocs.filter((d) => d.uploaderRole === "tenant");
  const myDocs = sharedDocs.filter((d) => d.uploaderRole === "property_manager");
  const isEmpty = sentLeases.length === 0 && applications.length === 0 && sharedDocs.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Documents</h1>
        <p className="text-sm text-neutral-600">
          Your portfolio&apos;s documentation library — pending &amp; signed applications and lease
          agreements, plus identification, paystubs, and other files tenants upload during onboarding.
          To create or edit an application or lease, use the Applications or Leases tab.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : isEmpty ? (
        <Card className="p-8">
          <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
            <FolderOpen className="h-10 w-10 text-neutral-300" />
            <p className="text-sm text-neutral-600">
              Nothing here yet — applications and lease agreements will appear once tenants start
              applying or signing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Agreements */}
          {(sentLeases.length > 0 || applications.length > 0) && (
            <section className="flex flex-col gap-4">
              <h2 className="text-base font-bold text-navy-900">Agreements</h2>

              {applications.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-navy-900">Applications</h3>
                  {applications.map((app) => (
                    <Card key={app.id} className="p-4">
                      <CardContent className="flex items-center justify-between gap-3 p-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <ClipboardList className="h-5 w-5 shrink-0 text-blue-500" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-navy-900">
                              <TenantLabel tenantId={app.tenantId} />
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
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge tone={APP_TONE[app.status] ?? "neutral"}>
                            {app.status.replace(/_/g, " ")}
                          </Badge>
                          <Button size="sm" variant="outline" href={`/pm/applications/view?id=${app.id}`}>
                            View
                          </Button>
                          <DeleteButton onDelete={() => handleDeleteApplication(app.id)} label="Delete application" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {sentLeases.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-navy-900">Lease Agreements</h3>
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
                          <DeleteButton onDelete={() => handleDeleteLease(lease.id)} label="Delete lease" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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
                        {d.category} · {formatBytes(d.sizeBytes)} · Tenant: <TenantLabel tenantId={d.tenantId} /> · {fmt(d.createdAt)}
                      </p>
                    </div>
                    <DeleteButton onDelete={() => handleDeleteSharedDoc(d)} label="Delete document" />
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
                          {d.category} · {formatBytes(d.sizeBytes)} · Tenant: <TenantLabel tenantId={d.tenantId} /> · {fmt(d.createdAt)}
                        </p>
                      </div>
                    </div>
                    <DeleteButton onDelete={() => handleDeleteSharedDoc(d)} label="Delete document" />
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

function TenantLabel({ tenantId }: { tenantId: string }) {
  const name = useUserDisplayName(tenantId);
  return (
    <>
      {name ?? "Unknown tenant"} <span className="font-mono">({tenantId.slice(0, 8)}…)</span>
    </>
  );
}

function DeleteButton({ onDelete, label }: { onDelete: () => Promise<void>; label: string }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!confirm) {
    return (
      <button
        type="button"
        title={label}
        onClick={() => setConfirm(true)}
        className="shrink-0 rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <span className="text-xs font-medium text-red-600">Delete?</span>
      <button
        type="button"
        disabled={deleting}
        onClick={async () => { setDeleting(true); await onDelete(); }}
        className="rounded bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
      >
        {deleting ? "…" : "Yes"}
      </button>
      <button
        type="button"
        disabled={deleting}
        onClick={() => setConfirm(false)}
        className="rounded border border-neutral-300 px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-50"
      >
        No
      </button>
    </div>
  );
}
