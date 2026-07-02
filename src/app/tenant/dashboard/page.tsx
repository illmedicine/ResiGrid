"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, query, where } from "firebase/firestore";
import Link from "next/link";
import {
  Bell,
  Copy,
  FileText,
  Home,
  MessageSquare,
  Wallet,
  Wrench,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { unitsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useActiveLease } from "@/lib/hooks/useActiveLease";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ReputationSummary } from "@/components/tenant/ReputationSummary";
import { ConfettiCelebration } from "@/components/shared/ConfettiCelebration";
import { WatermarkLogo } from "@/components/ui/WatermarkLogo";
import { leaseTermsCol } from "@/lib/firebase/firestore";
import type { LeaseTermsDoc, PropertyDoc, UnitDoc } from "@/lib/types/models";

export default function TenantDashboardPage() {
  const { user, userDoc } = useAuth();
  const { lease, loading } = useActiveLease(user?.uid);
  const [myUnit, setMyUnit] = useState<UnitDoc | null>(null);
  const [myProperty, setMyProperty] = useState<PropertyDoc | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [fullySignedLease, setFullySignedLease] = useState<LeaseTermsDoc | null>(null);

  // Load the unit the tenant is assigned to
  useEffect(() => {
    if (!user) return;
    const q = query(unitsCol(), where("currentTenantId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const unit = { ...snap.docs[0].data(), id: snap.docs[0].id } as UnitDoc;
        setMyUnit(unit);
      } else {
        setMyUnit(null);
      }
    });
    return unsub;
  }, [user]);

  // Load the property for that unit
  useEffect(() => {
    if (!myUnit?.propertyId) { setMyProperty(null); return; }
    const unsub = onSnapshot(doc(db, "properties", myUnit.propertyId), (snap) => {
      setMyProperty(snap.exists() ? ({ ...snap.data(), id: snap.id } as PropertyDoc) : null);
    });
    return unsub;
  }, [myUnit?.propertyId]);

  // Check for fully signed lease → trigger confetti once per session
  useEffect(() => {
    if (!user) return;
    const q = query(leaseTermsCol(), where("tenantId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const signed = snap.docs
        .map((d) => ({ ...d.data(), id: d.id } as LeaseTermsDoc))
        .find((l) => l.status === "fully_signed");
      if (signed) {
        setFullySignedLease(signed);
        const key = `confetti_shown_${user.uid}`;
        const last = sessionStorage.getItem(key);
        const today = new Date().toDateString();
        if (last !== today) {
          sessionStorage.setItem(key, today);
          setShowConfetti(true);
        }
      }
    });
    return unsub;
  }, [user]);

  function copyUID() {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative flex flex-col gap-5">
      {showConfetti && (
        <ConfettiCelebration
          message={fullySignedLease ? "Your lease is fully signed!" : undefined}
          onDone={() => setShowConfetti(false)}
        />
      )}
      <WatermarkLogo size={500} opacity={0.04} />

      <div>
        <h1 className="text-xl font-bold text-navy-900">
          Welcome{userDoc?.displayName ? `, ${userDoc.displayName}` : ""}
        </h1>
        <p className="text-sm text-neutral-600">
          Here&apos;s everything about your rental.
        </p>
      </div>

      {/* Tenant UID card */}
      <Card className="p-4 border-navy-900/10">
        <CardContent className="p-0">
          <p className="text-xs font-medium text-neutral-500 mb-1">
            Your Tenant ID (share with your property manager)
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-navy-900 break-all">
              {user?.uid ?? "—"}
            </span>
            <button
              type="button"
              onClick={copyUID}
              className="flex items-center gap-1 rounded-full bg-navy-900/5 px-2 py-1 text-[10px] font-medium text-navy-900 hover:bg-navy-900/10 transition"
            >
              <Copy className="h-3 w-3" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="mt-1 text-[10px] text-neutral-400">
            This ID never changes. Property managers can search for you by name and your ID
            will auto-populate to assign you to a unit.
          </p>
        </CardContent>
      </Card>

      {/* Property & Unit info */}
      {myProperty && myUnit && (
        <Card className="p-5">
          <CardContent className="flex flex-col gap-3 p-0">
            <h2 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
              <Home className="h-4 w-4 text-orange-500" />
              Your property
            </h2>
            <div className="flex items-start gap-4">
              {/* Property photos */}
              {myProperty.photos.length > 0 && (
                <div className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={myProperty.photos[0]}
                    alt={myProperty.name}
                    className="h-24 w-32 rounded-lg object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-navy-900">{myProperty.name}</p>
                <p className="text-xs text-neutral-600">
                  {myProperty.addressLine1}
                  {myProperty.addressLine2 && `, ${myProperty.addressLine2}`}
                </p>
                <p className="text-xs text-neutral-600">
                  {myProperty.city}, {myProperty.state} {myProperty.zip}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Unit {myUnit.unitNumber} · {myUnit.beds} bed · {myUnit.baths} bath
                  {myUnit.sqft ? ` · ${myUnit.sqft} sqft` : ""}
                </p>
              </div>
            </div>
            {/* All listing photos */}
            {myProperty.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {myProperty.photos.slice(1).map((p, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={i}
                    src={p}
                    alt={`${myProperty.name} ${i + 2}`}
                    className="h-16 w-20 shrink-0 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current lease card */}
      <Card className="p-5">
        <CardContent className="flex flex-col gap-3 p-0">
          <h2 className="text-sm font-semibold text-navy-900">Current lease</h2>
          {loading ? (
            <p className="text-sm text-neutral-600">Loading…</p>
          ) : lease ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-navy-900">
                  ${lease.rentAmount.toLocaleString()}/mo
                </p>
                <p className="text-xs text-neutral-600">
                  Due on day {lease.dueDay} of each month
                </p>
              </div>
              <div className="flex gap-2">
                <Button href="/tenant/pay" size="sm">
                  <Wallet className="h-4 w-4" />
                  Pay rent
                </Button>
                <Button href="/tenant/lease" size="sm" variant="outline">
                  <FileText className="h-4 w-4" />
                  View lease
                </Button>
              </div>
            </div>
          ) : myUnit ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-neutral-600">
                You&apos;re assigned to a unit — your property manager will send your lease shortly.
              </p>
              <Badge tone="neutral" className="w-fit">Awaiting lease</Badge>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-neutral-600">
                No active lease yet. Browse listings or contact your property manager.
              </p>
              <div className="flex gap-2">
                <Button href="/listings" size="sm" className="w-fit">
                  Browse listings
                </Button>
                <Button href="/tenant/pay" size="sm" variant="outline" className="w-fit">
                  <Wallet className="h-4 w-4" />
                  Pay anyone
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {user && <ReputationSummary tenantId={user.uid} />}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink href="/tenant/payments" icon={FileText} label="Payment history" />
        <QuickLink href="/tenant/applications" icon={Bell} label="My applications" />
        <QuickLink href="/tenant/maintenance" icon={Wrench} label="Maintenance" />
        <QuickLink href="/tenant/messages" icon={MessageSquare} label="Messages" />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof FileText;
  label: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
        <span className="rounded-lg bg-navy-900/5 p-2 text-navy-900">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-sm font-medium text-navy-900">{label}</span>
      </Card>
    </Link>
  );
}
