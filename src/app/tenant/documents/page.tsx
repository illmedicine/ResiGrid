"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, deleteDoc, doc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { storage } from "@/lib/firebase/config";
import { sharedDocumentsCol, unitsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { SharedDocumentDoc } from "@/lib/types/models";

const CATEGORIES = ["lease", "application", "maintenance", "other"] as const;

export default function TenantDocumentsPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<SharedDocumentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<"lease" | "application" | "maintenance" | "other">("other");
  const [pmId, setPmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find the tenant's assigned unit to get the PM's property
  useEffect(() => {
    if (!user) return;
    getDocs(query(unitsCol(), where("currentTenantId", "==", user.uid)))
      .then((snap: { docs: Array<{ data: () => { propertyId: string } }> }) => {
        const unit = snap.docs[0]?.data();
        if (unit) setPmId(unit.propertyId);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(sharedDocumentsCol(), where("tenantId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      setDocs(snap.docs.map((d) => ({ ...d.data(), id: d.id } as SharedDocumentDoc)).sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, () => setLoading(false));
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

  async function handleDelete(document: SharedDocumentDoc) {
    if (document.uploaderId !== user?.uid) return;
    await deleteDoc(doc(sharedDocumentsCol(), document.id));
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const fromPM = docs.filter((d) => d.uploaderRole === "property_manager");
  const fromMe = docs.filter((d) => d.uploaderRole === "tenant");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Documents</h1>
        <p className="text-sm text-neutral-600">View documents shared by your property manager and upload your own.</p>
      </div>

      {/* Documents from PM */}
      {fromPM.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-navy-900">From your property manager</h2>
          {fromPM.map((document) => (
            <Card key={document.id} className="p-4">
              <CardContent className="flex items-center gap-3 p-0">
                <FileText className="h-5 w-5 shrink-0 text-orange-500" />
                <div className="min-w-0 flex-1">
                  <a href={document.url} target="_blank" rel="noreferrer" className="truncate text-sm font-medium text-navy-900 hover:text-orange-600">
                    {document.name}
                  </a>
                  <p className="text-xs text-neutral-500">
                    {document.category} · {formatBytes(document.sizeBytes)} · {new Date(document.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload your own */}
      <Card className="p-5">
        <CardContent className="flex flex-col gap-4 p-0">
          <h2 className="text-sm font-semibold text-navy-900">Upload a document</h2>
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="w-48"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </Select>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Choose files"}
          </Button>
        </CardContent>
      </Card>

      {/* My uploaded docs */}
      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : fromMe.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-navy-900">Your uploaded documents</h2>
          {fromMe.map((document) => (
            <Card key={document.id} className="p-4">
              <CardContent className="flex items-center justify-between gap-3 p-0">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 shrink-0 text-orange-500" />
                  <div className="min-w-0">
                    <a href={document.url} target="_blank" rel="noreferrer" className="truncate text-sm font-medium text-navy-900 hover:text-orange-600">
                      {document.name}
                    </a>
                    <p className="text-xs text-neutral-500">
                      {document.category} · {formatBytes(document.sizeBytes)} · {new Date(document.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => handleDelete(document)} className="shrink-0 text-neutral-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && docs.length === 0 && (
        <Card className="p-8">
          <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
            <FileText className="h-10 w-10 text-neutral-300" />
            <p className="text-sm text-neutral-600">No documents yet. Documents shared by your property manager will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
