"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { Clock, Eye, FilePlus2, PenLine } from "lucide-react";
import { leaseTermsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { LeaseTermsDoc } from "@/lib/types/models";

const SIGN_WINDOW_MS = 48 * 60 * 60 * 1000;

const STATUS_TONE = {
  draft: "neutral",
  sent: "navy",
  tenant_signed: "warning",
  fully_signed: "success",
  expired: "danger",
} as const;

function ExpiryLabel({ sentAt }: { sentAt: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, sentAt + SIGN_WINDOW_MS - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, sentAt + SIGN_WINDOW_MS - Date.now())), 15000);
    return () => clearInterval(id);
  }, [sentAt]);
  if (remaining === 0) return <span className="flex items-center gap-1 text-xs font-medium text-red-600"><Clock className="h-3 w-3" />Expired</span>;
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  return <span className="flex items-center gap-1 text-xs text-orange-600"><Clock className="h-3 w-3" />{h}h {m}m left</span>;
}

export default function PmLeasesPage() {
  const { user } = useAuth();
  const [leaseTerms, setLeaseTerms] = useState<LeaseTermsDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(leaseTermsCol(), where("pmId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      setLeaseTerms(
        snap.docs
          .map((d) => ({ ...d.data(), id: d.id } as LeaseTermsDoc))
          .sort((a, b) => b.createdAt - a.createdAt),
      );
      setLoading(false);
    }, () => setLoading(false));
  }, [user]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Lease Agreements</h1>
          <p className="text-sm text-neutral-600">Create, manage, and send leases to your tenants.</p>
        </div>
        <Button href="/pm/leases/new" size="sm">
          <FilePlus2 className="h-4 w-4" /> Create lease
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : leaseTerms.length === 0 ? (
        <Card className="p-8">
          <CardContent className="flex flex-col items-center gap-4 p-0 text-center">
            <FilePlus2 className="h-10 w-10 text-neutral-300" />
            <div>
              <p className="font-semibold text-navy-900">No leases yet</p>
              <p className="mt-1 text-sm text-neutral-600">Create your first lease and send it directly to a tenant.</p>
            </div>
            <Button href="/pm/leases/new" size="sm">Create your first lease</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {leaseTerms.map((lease) => (
            <Link key={lease.id} href={`/pm/leases/view/?id=${lease.id}`}>
              <Card className="p-4 transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-3 p-0">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-navy-900">
                      {lease.tenantName || "Unnamed tenant"}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {new Date(lease.startDate).toLocaleDateString()} ·{" "}
                      ${lease.rent.toLocaleString()}/mo ·{" "}
                      {lease.termType === "month-to-month" ? "M2M" :
                       lease.termType === "12-month" ? "12 mo" :
                       lease.termType === "24-month" ? "24 mo" :
                       `${lease.customMonths} mo`}
                    </p>
                    <div className="flex items-center gap-3">
                      {lease.viewedAt && (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <Eye className="h-3 w-3" />Viewed
                        </span>
                      )}
                      {lease.tenantSignedAt && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <PenLine className="h-3 w-3" />Signed
                        </span>
                      )}
                      {lease.status === "sent" && lease.sentAt && (
                        <ExpiryLabel sentAt={lease.sentAt} />
                      )}
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[lease.status] as "neutral"}>
                    {lease.status.replace(/_/g, " ")}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
