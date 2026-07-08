"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { BedDouble, UserPlus } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { useOwnerApplications } from "@/lib/hooks/useOwnerApplications";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { ApplicationReviewCard } from "@/components/pm/ApplicationReviewCard";
import type { ApplicationDoc, PropertyDoc, UnitDoc } from "@/lib/types/models";

const ACTIVE_STATUSES = new Set(["submitted", "under_review", "more_info_needed"]);

export default function PmApplicationsPage() {
  const { user } = useAuth();
  const { applications, loading } = useOwnerApplications(user?.uid);
  const [units, setUnits] = useState<Record<string, UnitDoc>>({});
  const [propertiesById, setPropertiesById] = useState<Record<string, PropertyDoc>>({});

  // Resolve unit + property names for group headers.
  useEffect(() => {
    const unitIds = Array.from(new Set(applications.map((a) => a.unitId).filter(Boolean))) as string[];
    const missing = unitIds.filter((id) => !(id in units));
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(missing.map((id) => getDoc(doc(db, "units", id)))).then(async (snaps) => {
      if (cancelled) return;
      const nextUnits: Record<string, UnitDoc> = {};
      const propertyIds = new Set<string>();
      snaps.forEach((snap, i) => {
        if (snap.exists()) {
          const unit = { ...snap.data(), id: snap.id } as UnitDoc;
          nextUnits[missing[i]] = unit;
          propertyIds.add(unit.propertyId);
        }
      });
      const missingProps = Array.from(propertyIds).filter((id) => !(id in propertiesById));
      const propSnaps = await Promise.all(missingProps.map((id) => getDoc(doc(db, "properties", id))));
      if (cancelled) return;
      setUnits((prev) => ({ ...prev, ...nextUnits }));
      if (propSnaps.length > 0) {
        setPropertiesById((prev) => {
          const next = { ...prev };
          propSnaps.forEach((snap, i) => {
            if (snap.exists()) next[missingProps[i]] = { ...snap.data(), id: snap.id } as PropertyDoc;
          });
          return next;
        });
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications]);

  // Group applications by unit so competing applicants for the same unit sit
  // together — a PM approves one and denies the rest from a single view.
  const groups = useMemo(() => {
    const byUnit = new Map<string, ApplicationDoc[]>();
    for (const app of applications) {
      const key = app.unitId ?? "__none__";
      const list = byUnit.get(key) ?? [];
      list.push(app);
      byUnit.set(key, list);
    }
    return Array.from(byUnit.entries()).sort((a, b) => {
      // Groups with the most active (undecided) applications first.
      const activeCount = (apps: ApplicationDoc[]) =>
        apps.filter((x) => ACTIVE_STATUSES.has(x.status)).length;
      return activeCount(b[1]) - activeCount(a[1]);
    });
  }, [applications]);

  function groupLabel(unitId: string): { title: string; sub?: string } {
    if (unitId === "__none__") return { title: "General applications" };
    const unit = units[unitId];
    if (!unit) return { title: "Unit…" };
    const property = propertiesById[unit.propertyId];
    return {
      title: `${property?.name ?? "Property"} · Unit ${unit.unitNumber}`,
      sub: `$${unit.rent.toLocaleString()}/mo · ${unit.status}`,
    };
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Applications</h1>
          <p className="text-sm text-neutral-600">
            All applications, grouped by unit — approve your pick and deny the rest.
            Applicants are screened by their ResiGrid reputation score.
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
                Open an application on a unit and submissions will appear here, or create one
                directly for a registered tenant.
              </p>
            </div>
            <Button href="/pm/applications/new" size="sm">Create your first application</Button>
          </CardContent>
        </Card>
      ) : (
        groups.map(([unitId, apps]) => {
          const { title, sub } = groupLabel(unitId);
          const activeCount = apps.filter((a) => ACTIVE_STATUSES.has(a.status)).length;
          return (
            <section key={unitId} className="flex flex-col gap-2">
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <BedDouble className="h-4 w-4 text-orange-500" />
                <h2 className="text-sm font-bold text-navy-900">{title}</h2>
                {sub && <span className="text-xs text-neutral-500">{sub}</span>}
                <Badge tone={activeCount > 0 ? "warning" : "neutral"}>
                  {apps.length} application{apps.length === 1 ? "" : "s"}
                  {activeCount > 0 ? ` · ${activeCount} awaiting decision` : ""}
                </Badge>
              </div>
              {apps.map((app) => (
                <ApplicationReviewCard key={app.id} application={app} />
              ))}
            </section>
          );
        })
      )}
    </div>
  );
}
