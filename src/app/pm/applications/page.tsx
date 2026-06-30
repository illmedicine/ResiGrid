"use client";

import { useAuth } from "@/lib/firebase/hooks";
import { useOwnerApplications } from "@/lib/hooks/useOwnerApplications";
import { Card, CardContent } from "@/components/ui/Card";
import { ApplicationReviewCard } from "@/components/pm/ApplicationReviewCard";

export default function PmApplicationsPage() {
  const { user } = useAuth();
  const { applications, loading } = useOwnerApplications(user?.uid);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Applications</h1>
        <p className="text-sm text-neutral-600">
          Review applicants, screened by their ResiGrid reputation score.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : applications.length === 0 ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">No applications yet.</p>
          </CardContent>
        </Card>
      ) : (
        applications.map((app) => (
          <ApplicationReviewCard key={app.id} application={app} />
        ))
      )}
    </div>
  );
}
