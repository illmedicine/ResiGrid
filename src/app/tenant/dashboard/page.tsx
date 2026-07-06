"use client";

import { useEffect, useRef, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  Home,
  MessageSquare,
  Shield,
  Upload,
  Wallet,
  Wrench,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { useTenantLeaseContext } from "@/lib/context/TenantLeaseContext";
import { useCurrentRentInvoice } from "@/lib/hooks/useCurrentRentInvoice";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ReputationSummary } from "@/components/tenant/ReputationSummary";
import { DaysDueCounter } from "@/components/tenant/DaysDueCounter";
import { ConfettiCelebration } from "@/components/shared/ConfettiCelebration";
import { WatermarkLogo } from "@/components/ui/WatermarkLogo";

const RESIDENT_BADGE = {
  id: "resident",
  label: "🏠 Resident",
  description: "Signed a lease and joined the Residential Grid Economy.",
};

export default function TenantDashboardPage() {
  const { user, userDoc } = useAuth();
  const { activeLeases, pendingLeases, selectedLease, loading: leasesLoading } =
    useTenantLeaseContext();
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showInsurance, setShowInsurance] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasSignedLease = activeLeases.length > 0;
  const myProperty = selectedLease?.property ?? null;
  const myUnit = selectedLease?.unit ?? null;
  const lease = selectedLease?.lease ?? null;

  // Celebrate the first time a fully-signed lease shows up, once per day.
  useEffect(() => {
    if (!user || !hasSignedLease) return;
    const key = `confetti_shown_${user.uid}`;
    const last = sessionStorage.getItem(key);
    const today = new Date().toDateString();
    if (last !== today) {
      sessionStorage.setItem(key, today);
      setShowConfetti(true);
    }
  }, [user, hasSignedLease]);

  // Bootstrap resident badge + 100 RGE pts for tenants with a signed lease who haven't been awarded yet
  useEffect(() => {
    if (!user || !hasSignedLease) return;
    const ref = doc(db, "reputationScores", user.uid);
    getDoc(ref).then((snap) => {
      const data = snap.data();
      if (data?.badges?.some((b: { id: string }) => b.id === "resident")) return;
      const badge = { ...RESIDENT_BADGE, earnedAt: Date.now() };
      if (snap.exists()) {
        updateDoc(ref, {
          badges: [...(data?.badges ?? []), badge],
          score: Math.max(data?.score ?? 0, 100),
        });
      } else {
        setDoc(ref, {
          tenantId: user.uid,
          onTimeCount: 0,
          lateCount: 0,
          totalCount: 0,
          currentStreak: 0,
          badges: [badge],
          score: 100,
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, hasSignedLease]);

  const heroPhotos: string[] = myProperty?.photos ?? [];

  // Auto-advance hero slider (through the selected property's own photos)
  useEffect(() => {
    if (heroPhotos.length <= 1) return;
    if (slideTimer.current) clearInterval(slideTimer.current);
    slideTimer.current = setInterval(() => {
      setHeroSlide((i) => (i + 1) % heroPhotos.length);
    }, 5000);
    return () => {
      if (slideTimer.current) clearInterval(slideTimer.current);
    };
  }, [heroPhotos.length]);

  // Reset slide index when the selected property changes
  useEffect(() => { setHeroSlide(0); }, [myProperty?.id]);

  function prevSlide() {
    setHeroSlide((i) => (i - 1 + heroPhotos.length) % heroPhotos.length);
  }
  function nextSlide() {
    setHeroSlide((i) => (i + 1) % heroPhotos.length);
  }

  function copyUID() {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalMonthlyRent = activeLeases.reduce((sum, l) => sum + (l.lease.rent ?? 0), 0);
  const { dueDate: invoiceDueDate, paid: invoicePaid } = useCurrentRentInvoice(
    lease?.id,
    lease?.startDate,
  );

  return (
    <div className="relative flex flex-col gap-5">
      {showConfetti && (
        <ConfettiCelebration
          message="Your lease is fully signed — welcome home!"
          onDone={() => setShowConfetti(false)}
        />
      )}
      <WatermarkLogo size={500} opacity={0.04} />

      {/* ── Multi-property aggregate strip ──────────────────────────── */}
      {activeLeases.length > 1 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs text-orange-800">
          <span className="font-semibold">{activeLeases.length} properties</span>
          <span>${totalMonthlyRent.toLocaleString()}/mo combined</span>
          <span className="text-orange-600">Use the property switcher above to view each one</span>
        </div>
      )}

      {/* ── My Home hero slider ──────────────────────────────────────── */}
      {hasSignedLease && (
        <Card className="overflow-hidden p-0">
          <CardContent className="flex flex-col gap-0 p-0">
            {heroPhotos.length > 0 ? (
              <div className="relative h-[60vw] max-h-[520px] min-h-[240px] overflow-hidden bg-navy-900">
                {/* Slides */}
                {heroPhotos.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt={`Home photo ${i + 1}`}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                      i === heroSlide ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  />
                ))}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/85 via-navy-900/15 to-transparent" />

                {/* MY HOME badge */}
                <div className="absolute right-3 top-3 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                  MY HOME
                </div>

                {/* Nav arrows — only when multiple photos */}
                {heroPhotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevSlide}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/35 p-2 text-white backdrop-blur-sm transition hover:bg-black/55"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextSlide}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/35 p-2 text-white backdrop-blur-sm transition hover:bg-black/55"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Dot indicators */}
                {heroPhotos.length > 1 && (
                  <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5">
                    {heroPhotos.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setHeroSlide(i)}
                        className={`rounded-full transition-all duration-300 ${
                          i === heroSlide
                            ? "w-5 h-1.5 bg-white"
                            : "w-1.5 h-1.5 bg-white/45 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Text overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-lg font-bold text-white drop-shadow">
                    {myProperty?.name ?? "My Home"}
                  </p>
                  {myUnit && (
                    <p className="text-sm text-white/80">
                      Unit {myUnit.unitNumber}
                      {myUnit.beds ? ` · ${myUnit.beds} bed` : ""}
                      {myUnit.baths ? ` · ${myUnit.baths} bath` : ""}
                      {myUnit.sqft ? ` · ${myUnit.sqft.toLocaleString()} sqft` : ""}
                    </p>
                  )}
                  {myProperty && (
                    <p className="text-xs text-white/65 mt-0.5">
                      {myProperty.addressLine1}, {myProperty.city}, {myProperty.state} {myProperty.zip}
                    </p>
                  )}
                  {heroPhotos.length > 1 && (
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {heroSlide + 1} / {heroPhotos.length}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* No-photo fallback */
              <div className="flex h-28 items-center gap-3 bg-navy-900/5 px-5">
                <Home className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="font-semibold text-navy-900">{myProperty?.name ?? "My Home"}</p>
                  {myProperty && (
                    <p className="text-xs text-neutral-500">
                      {myProperty.addressLine1}, {myProperty.city}, {myProperty.state}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Greeting + rent due ───────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-navy-900">
            {userDoc?.displayName ? `Welcome back, ${userDoc.displayName.split(" ")[0]}` : "Welcome back"}
          </h1>
          {lease ? (
            <p className="text-sm text-neutral-600">
              Rent ${lease.rent.toLocaleString()}/mo
            </p>
          ) : (
            <p className="text-sm text-neutral-600">Here&apos;s everything about your rental.</p>
          )}
        </div>
        {lease && (
          <div className="flex items-center gap-2">
            <DaysDueCounter dueDate={invoiceDueDate} paid={invoicePaid} />
            <Button href="/tenant/pay" size="sm">
              <Wallet className="h-4 w-4" />
              Pay rent
            </Button>
          </div>
        )}
      </div>

      {/* ── Primary action cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ActionCard href="/tenant/pay" icon={Wallet} label="Pay Rent" sub="Fee-free ACH" primary />
        <ActionCard href="/tenant/maintenance" icon={Wrench} label="Maintenance" sub="Submit a request" />
        <button
          type="button"
          onClick={() => setShowInsurance((v) => !v)}
          className="flex flex-col items-start gap-2 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md active:scale-[0.98]"
        >
          <span className="rounded-xl bg-navy-900/5 p-2.5 text-navy-900">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-navy-900">Insurance</p>
            <p className="text-xs text-neutral-500">Renter&apos;s coverage</p>
          </div>
        </button>
        <ActionCard href="/tenant/lease" icon={FileText} label="My Lease" sub="View & sign" />
      </div>

      {/* ── Renter's insurance panel ──────────────────────────────── */}
      {showInsurance && (
        <Card className="p-5 border-navy-900/10">
          <CardContent className="flex flex-col gap-4 p-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-navy-900" />
                <h2 className="text-sm font-semibold text-navy-900">Renter&apos;s Insurance</h2>
              </div>
              <Badge tone="neutral">Recommended</Badge>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Most landlords require renter&apos;s insurance. It protects your personal
              belongings against theft, fire, and water damage — and covers you if
              someone is injured in your unit. Policies typically cost{" "}
              <strong className="text-navy-900">$10–$20/month</strong>.
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <InsurancePartner name="Lemonade" desc="AI-powered · instant quote" href="https://www.lemonade.com/renters" />
              <InsurancePartner name="Toggle" desc="Flexible monthly coverage" href="https://www.toggle.com" />
              <InsurancePartner name="Hippo" desc="Modern home protection" href="https://www.hippo.com" />
            </div>

            <div className="border-t border-neutral-100 pt-3">
              <p className="mb-2 text-xs font-medium text-neutral-700">
                Already have a policy? Upload your declaration page:
              </p>
              <Button href="/tenant/documents" size="sm" variant="outline">
                <Upload className="h-3.5 w-3.5" />
                Upload insurance doc
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Lease status (if no active lease) ────────────────────── */}
      {!leasesLoading && !lease && (
        <Card className="p-5">
          <CardContent className="flex flex-col gap-2 p-0">
            <h2 className="text-sm font-semibold text-navy-900">Lease status</h2>
            {pendingLeases.length > 0 ? (
              <>
                <p className="text-sm text-neutral-600">
                  You have a lease awaiting your signature.
                </p>
                <Button href="/tenant/lease" size="sm" className="w-fit">Review & sign</Button>
              </>
            ) : (
              <>
                <p className="text-sm text-neutral-600">
                  No active lease yet. Browse listings or contact your property manager.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button href="/listings" size="sm" className="w-fit">Browse listings</Button>
                  <Button href="/tenant/pay" size="sm" variant="outline" className="w-fit">
                    <Wallet className="h-4 w-4" />Pay anyone
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── RGE Score ────────────────────────────────────────────── */}
      {user && <ReputationSummary tenantId={user.uid} />}

      {/* ── More links ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink href="/tenant/payments" icon={FileText} label="Payment history" />
        <QuickLink href="/tenant/messages" icon={MessageSquare} label="Messages" />
        <QuickLink href="/tenant/applications" icon={Bell} label="Applications" />
        <QuickLink href="/tenant/documents" icon={Upload} label="Documents" />
      </div>

      {/* ── Tenant ID ────────────────────────────────────────────── */}
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
        </CardContent>
      </Card>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  label,
  sub,
  primary = false,
}: {
  href: string;
  icon: typeof Wallet;
  label: string;
  sub: string;
  primary?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={`flex flex-col items-start gap-2 rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md active:scale-[0.98] ${
          primary
            ? "border-orange-400 bg-orange-500 text-white"
            : "border-neutral-200 bg-white"
        }`}
      >
        <span className={`rounded-xl p-2.5 ${primary ? "bg-white/20 text-white" : "bg-navy-900/5 text-navy-900"}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className={`text-sm font-semibold ${primary ? "text-white" : "text-navy-900"}`}>{label}</p>
          <p className={`text-xs ${primary ? "text-white/75" : "text-neutral-500"}`}>{sub}</p>
        </div>
      </div>
    </Link>
  );
}

function InsurancePartner({ name, desc, href }: { name: string; desc: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs transition hover:border-orange-200 hover:bg-orange-50"
    >
      <div>
        <p className="font-semibold text-navy-900">{name}</p>
        <p className="text-neutral-500">{desc}</p>
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
    </a>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: typeof FileText; label: string }) {
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
