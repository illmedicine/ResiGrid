"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { storage } from "@/lib/firebase/config";
import { sharedDocumentsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { SharedDocumentDoc } from "@/lib/types/models";

const CATEGORIES = ["lease", "application", "maintenance", "other"] as const;

export default function PmDocumentsPage() {
  const { user, userDoc } = useAuth();
  const [docs, setDocs] = useState<SharedDocumentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<"lease" | "application" | "maintenance" | "other">("other");
  const [tenantId, setTenantId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(sharedDocumentsCol(), where("pmId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      setDocs(snap.docs.map((d) => ({ ...d.data(), id: d.id } as SharedDocumentDoc)).sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, () => setLoading(false));
  }, [user]);

  async function handleUpload(files: FileList | null) {
    if (!files || !user || !tenantId.trim()) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const path = `documents/${user.uid}/${tenantId}/${Date.now()}-${file.name}`;
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
        // continue with other files
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(document: SharedDocumentDoc) {
    await deleteDoc(doc(sharedDocumentsCol(), document.id));
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Documents</h1>
        <p className="text-sm text-neutral-600">Upload and share documents with your tenants.</p>
      </div>

      {/* Upload section */}
      <Card className="p-5">
        <CardContent className="flex flex-col gap-4 p-0">
          <h2 className="text-sm font-semibold text-navy-900">Upload document</h2>
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
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </Select>
          </div>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !tenantId.trim()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Choose files to upload"}
          </Button>
          {!tenantId.trim() && <p className="text-xs text-neutral-500">Enter a tenant UID to enable upload.</p>}
        </CardContent>
      </Card>

      {/* Document list */}
      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : docs.length === 0 ? (
        <Card className="p-8">
          <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
            <FileText className="h-10 w-10 text-neutral-300" />
            <p className="text-sm text-neutral-600">No documents yet. Upload one above to share with a tenant.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {docs.map((document) => (
            <Card key={document.id} className="p-4">
              <CardContent className="flex items-center justify-between gap-3 p-0">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 shrink-0 text-orange-500" />
                  <div className="min-w-0">
                    <a href={document.url} target="_blank" rel="noreferrer" className="truncate text-sm font-medium text-navy-900 hover:text-orange-600">
                      {document.name}
                    </a>
                    <p className="text-xs text-neutral-500">
                      {document.category} · {formatBytes(document.sizeBytes)} · Tenant: <span className="font-mono">{document.tenantId.slice(0, 8)}…</span>
                    </p>
                  </div>
                </div>
                {document.uploaderId === user?.uid && (
                  <button type="button" onClick={() => handleDelete(document)} className="shrink-0 text-neutral-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
