"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { LeasePreviewDoc } from "@/components/pm/lease/LeasePreviewDoc";
import { Button } from "@/components/ui/Button";
import { Send } from "lucide-react";
import type { LeaseTermsDoc } from "@/lib/types/models";

function LeaseViewContent() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  const [lease, setLease] = useState<LeaseTermsDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const unsub = onSnapshot(doc(db, "leaseTerms", id), (snap) => {
      setLease(snap.exists() ? (snap.data() as LeaseTermsDoc) : null);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  async function handleSend() {
    if (!id) return;
    await updateDoc(doc(db, "leaseTerms", id), {
      status: "sent",
      sentAt: Date.now(),
    });
  }

  if (!id) return <p className="text-sm text-neutral-600">No lease specified.</p>;
  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>;
  if (!lease) return <p className="text-sm text-neutral-600">Lease not found.</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Lease Agreement</h1>
          <p className="text-sm text-neutral-600">
            {lease.tenantName} · Unit {lease.unitId}
          </p>
        </div>
        <div className="flex gap-2">
          <Button href="/pm/leases/new" variant="outline" size="sm">
            New lease
          </Button>
          {lease.status === "draft" && (
            <Button size="sm" onClick={handleSend}>
              <Send className="h-4 w-4" />
              Send to tenant
            </Button>
          )}
        </div>
      </div>
      <LeasePreviewDoc lease={lease} />
    </div>
  );
}

export default function PmLeaseViewPage() {
  return (
    <Suspense>
      <LeaseViewContent />
    </Suspense>
  );
}
