"use client";

import { useEffect, useState } from "react";
import { onSnapshot, orderBy, query, where } from "firebase/firestore";
import { applicationsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ApplicationDoc, ApplicationStatus } from "@/lib/types/models";

const statusTone: Record<
  ApplicationStatus,
  "neutral" | "navy" | "success" | "danger"
> = {
  submitted: "neutral",
  under_review: "navy",
  approved: "success",
  denied: "danger",
  withdrawn: "neutral",
};

export default function TenantApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      applicationsCol(),
      where("tenantId", "==", user.uid),
      orderBy("submittedAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setApplications(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [user]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">My applications</h1>
        <p className="text-sm text-neutral-600">
          Track the status of apartments you&apos;ve applied to.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : applications.length === 0 ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">
              You haven&apos;t applied to any listings yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        applications.map((app) => (
          <Card key={app.id} className="p-4">
            <CardContent className="flex items-center justify-between p-0">
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  Listing {app.listingId}
                </p>
                <p className="text-xs text-neutral-600">
                  Submitted {new Date(app.submittedAt).toLocaleDateString()}
                </p>
              </div>
              <Badge tone={statusTone[app.status]}>
                {app.status.replace("_", " ")}
              </Badge>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
