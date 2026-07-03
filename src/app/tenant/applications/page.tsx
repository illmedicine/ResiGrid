"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { applicationsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { ApplicationDoc, ApplicationStatus, ListingDoc } from "@/lib/types/models";

const STATUS_TONE: Record<ApplicationStatus, "neutral" | "navy" | "success" | "danger" | "orange"> = {
  shortlisted: "orange",
  invited: "orange",
  submitted: "neutral",
  under_review: "navy",
  more_info_needed: "orange",
  approved: "success",
  denied: "danger",
  withdrawn: "neutral",
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  shortlisted: "Shortlisted",
  invited: "Invited to Apply",
  submitted: "Under Review",
  under_review: "Under Review",
  more_info_needed: "More Info Needed",
  approved: "Approved",
  denied: "Denied",
  withdrawn: "Withdrawn",
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
    return onSnapshot(
      q,
      (snap) => {
        setApplications(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user]);

  const actionNeeded = applications.filter(
    (a) => a.status === "invited" || a.status === "more_info_needed",
  );
  const others = applications.filter(
    (a) => a.status !== "invited" && a.status !== "more_info_needed",
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">My applications</h1>
        <p className="text-sm text-neutral-600">
          Track your applications and respond to requests from property managers.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : applications.length === 0 ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">
              No applications yet. Browse listings and apply to get started.
            </p>
            <Button href="/listings" size="sm" className="mt-3">
              Browse listings
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Action required */}
          {actionNeeded.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-orange-600">
                ⚡ Action required — {actionNeeded.length}{" "}
                {actionNeeded.length !== 1 ? "items" : "item"}
              </h2>
              {actionNeeded.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </div>
          )}

          {/* Everything else */}
          {others.length > 0 && (
            <div className="flex flex-col gap-3">
              {actionNeeded.length > 0 && (
                <h2 className="text-sm font-semibold text-navy-900">All applications</h2>
              )}
              {others.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ApplicationCard({ application }: { application: ApplicationDoc }) {
  const [listing, setListing] = useState<ListingDoc | null>(null);

  useEffect(() => {
    if (!application.listingId || application.listingId.startsWith("demo-")) return;
    const unsub = onSnapshot(doc(db, "listings", application.listingId), (snap) => {
      if (snap.exists()) setListing({ ...snap.data(), id: snap.id } as ListingDoc);
    });
    return unsub;
  }, [application.listingId]);

  const tone = STATUS_TONE[application.status];
  const label = STATUS_LABEL[application.status];
  const needsAction =
    application.status === "invited" || application.status === "more_info_needed";

  return (
    <Card
      className={`p-4 transition ${needsAction ? "border-orange-300 bg-orange-50/30" : ""}`}
    >
      <CardContent className="flex items-center gap-4 p-0 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-navy-900 truncate">
              {listing?.title ?? `Listing ${application.listingId}`}
            </p>
            <Badge tone={tone}>{label}</Badge>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500">
            {listing && (
              <span>
                {listing.city}, {listing.state} · ${listing.rent.toLocaleString()}/mo
              </span>
            )}
            <span>
              {application.submittedAt
                ? `Applied ${new Date(application.submittedAt).toLocaleDateString()}`
                : "Invited"}
            </span>
          </div>
          {application.status === "more_info_needed" && application.decisionNote && (
            <p className="mt-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1">
              <strong>Requested:</strong> {application.decisionNote}
            </p>
          )}
          {application.status === "approved" && (
            <p className="mt-1.5 text-xs text-green-700 font-medium">
              ✅ Approved — your lease agreement will arrive shortly.
            </p>
          )}
        </div>

        <Button
          href={`/tenant/applications/view/?id=${application.id}`}
          size="sm"
          variant={needsAction ? "primary" : "outline"}
        >
          {needsAction ? "View & respond →" : "View application →"}
        </Button>
      </CardContent>
    </Card>
  );
}
