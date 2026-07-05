"use client";

import { UserPlus } from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { useOwnerApplications } from "@/lib/hooks/useOwnerApplications";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ApplicationReviewCard } from "@/components/pm/ApplicationReviewCard";

export default function PmApplicationsPage() {
  const { user } = useAuth();
  const { applications, loading } = useOwnerApplications(user?.uid);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Applications</h1>
          <p className="text-sm text-neutral-600">
            Review applicants, screened by their ResiGrid reputation score.
          </p>
        </div>
        <Button href="/pm/applications/new" size="sm">
          <UserPlus className="h-4 w-4" /> New application
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : applications.length === 0 ? (
        <Card className="p-8">
          <CardContent className="flex flex-col items-center gap-4 p-0 text-center">
            <UserPlus className="h-10 w-10 text-neutral-300" />
            <div>
              <p className="font-semibold text-navy-900">No applications yet</p>
              <p className="mt-1 text-sm text-neutral-600">
                Applications from your listings will appear here, or create one directly.
              </p>
            </div>
            <Button href="/pm/applications/new" size="sm">Create your first application</Button>
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
