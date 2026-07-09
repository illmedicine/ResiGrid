import Link from "next/link";
import {
  Award,
  BarChart3,
  Building2,
  FileCheck,
  Search,
  ShieldCheck,
  Wallet,
  Wrench,
} from "lucide-react";
import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { HeroCTAs } from "@/components/layout/HeroCTAs";
import { FlipCounter } from "@/components/shared/FlipCounter";
import { Card, CardContent } from "@/components/ui/Card";

const BG = {
  hero:      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80",
  pm:        "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1920&q=80",
  tenant:    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1920&q=80",
  lifestyle: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1920&q=80",
};

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />
      <FlipCounter />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[620px] flex-col items-center justify-center px-4 py-24 text-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(11,31,58,0.85) 0%, rgba(11,31,58,0.72) 55%, rgba(11,31,58,0.95) 100%), url('${BG.hero}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-orange-400">
          The Residential Grid Economy
        </p>
        <h1 className="mx-auto max-w-3xl text-3xl font-bold text-orange-400 md:text-5xl md:leading-tight">
          Your Portfolio. Your Tenants.{" "}
          <span className="text-white">Zero Hidden Fees.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm text-white/80 md:text-base md:leading-relaxed">
          ResiGrid is the only property management platform built on{" "}
          <span className="font-semibold text-orange-300">transparent, fair pricing</span>.
          Landlords pay only for occupied units. Tenants pay{" "}
          <span className="font-semibold text-orange-300">$0 to pay rent</span> — forever.
          Every on-time payment builds the{" "}
          <span className="font-semibold text-orange-300">RGE Score</span>, the most reliable
          indicator of tenant quality on the planet.
        </p>
        <HeroCTAs />
      </section>

      {/* ── Portal choice cards — PM first ───────────────────────── */}
      <section className="mx-auto -mt-8 grid w-full max-w-4xl gap-4 px-4 pb-12 sm:grid-cols-2 md:-mt-10">
        {/* PM card — left / first */}
        <Link href="/login?role=property_manager" className="block">
          <Card className="h-full border-2 border-orange-200 p-6 transition-all hover:-translate-y-1 hover:border-orange-400 hover:shadow-xl">
            <CardContent className="flex flex-col items-start gap-3 p-0">
              <span className="rounded-full bg-orange-100 p-3 text-orange-600">
                <Building2 className="h-6 w-6" />
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-navy-900">I&apos;m a Property Owner</h2>
                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  START HERE
                </span>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                The complete property management command center — built for landlords who mean business.
                Upload property photos, publish listings, and screen applicants with verified{" "}
                <strong className="text-navy-900">RGE Scores</strong> in minutes — not days.
              </p>
              <ul className="flex flex-col gap-1.5 text-xs text-neutral-600">
                <li className="flex items-start gap-1.5"><span className="mt-0.5 text-orange-500">✦</span><span><strong className="text-navy-900">Go live in 1 minute.</strong> Add a property, upload photos, post a listing — done.</span></li>
                <li className="flex items-start gap-1.5"><span className="mt-0.5 text-orange-500">✦</span><span><strong className="text-navy-900">Custom leases & applications.</strong> Build from our template library. E-sign ready.</span></li>
                <li className="flex items-start gap-1.5"><span className="mt-0.5 text-orange-500">✦</span><span><strong className="text-navy-900">Collect rent fee-free.</strong> Tenants pay $0 in transaction fees — always.</span></li>
                <li className="flex items-start gap-1.5"><span className="mt-0.5 text-orange-500">✦</span><span><strong className="text-navy-900">Team access.</strong> Invite co-managers and assign them specific properties.</span></li>
                <li className="flex items-start gap-1.5"><span className="mt-0.5 text-orange-500">✦</span><span><strong className="text-navy-900">One stop shop.</strong> Maintenance, notices, documents, messages — all in one portal.</span></li>
              </ul>
              <p className="text-xs text-neutral-500">
                Solo landlord or 500-unit portfolio —{" "}
                <strong className="text-navy-900">only pay for occupied units.</strong>{" "}
                Vacant units are always free.
              </p>
              <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-orange-600">
                Start free for 3 days →
              </span>
            </CardContent>
          </Card>
        </Link>

        {/* Tenant card — right / second */}
        <Card className="h-full p-6 transition-all hover:-translate-y-1 hover:shadow-xl">
          <CardContent className="flex flex-col items-start gap-3 p-0 h-full">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-navy-900/10 p-3 text-navy-900">
                <Wallet className="h-6 w-6" />
              </span>
              <span className="rounded-full bg-orange-50 p-3 text-orange-500">
                <Search className="h-6 w-6" />
              </span>
            </div>
            <h2 className="text-xl font-bold text-navy-900">I&apos;m a Tenant</h2>
            <p className="text-sm text-neutral-600">
              Search thousands of apartments nationwide, apply directly, and pay rent
              fee-free. Every on-time payment builds your portable{" "}
              <strong className="text-navy-900">RGE Trust Profile</strong>—a reputation
              that travels with you to your next home.
            </p>
            <ul className="mt-1 flex flex-col gap-1.5 text-xs text-neutral-500">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                Browse &amp; apply — no account needed to search
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                $0 rent payment fees — forever
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                Portable RGE Score follows you property to property
              </li>
            </ul>
            <div className="mt-auto flex flex-wrap gap-2 pt-3">
              <Link
                href="/listings"
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
              >
                Browse listings →
              </Link>
              <Link
                href="/login?role=tenant"
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-navy-900 hover:border-orange-300 transition"
              >
                Join the Grid →
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── PM value proposition (image band) — FIRST ─────────────── */}
      <section
        className="relative w-full px-4 py-24 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,58,0.78), rgba(242,121,29,0.25)), url('${BG.pm}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-orange-300">
          For Property Managers &amp; Landlords
        </p>
        <h2 className="mx-auto max-w-2xl text-2xl font-bold text-orange-400 md:text-4xl">
          Zero-Risk Leasing.{" "}
          <span className="text-white">Backed by the RGE Ledger.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/75 md:text-base">
          Traditional background checks only tell you what an applicant{" "}
          <em>hasn&apos;t</em> done. The RGE Score tells you exactly what they{" "}
          <em>will</em> do. ResiGrid gives you a transparent, flat-rate platform that
          eliminates tenant pushback over portal fees while attracting renters who are
          highly motivated to protect their perfect payment streak.
        </p>
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
          <TenantFeature icon={ShieldCheck} title="Immutable Reliability" desc="Verified, secure payment ledgers—not fragmented credit scores." />
          <TenantFeature icon={Award} title="Lower Turnover" desc="RGE-verified tenants are invested in their score and your property." />
          <TenantFeature icon={Building2} title="Automated Ecosystem" desc="Rent collection, maintenance triage, and unit monitoring in one portal." />
        </div>
        <Link
          href="/login?role=property_manager"
          className="mt-10 inline-block rounded-lg bg-white px-7 py-3 text-sm font-bold text-navy-900 hover:bg-orange-100"
        >
          Start your free 3-day trial
        </Link>
      </section>

      {/* ── Pricing teaser — PM-focused ───────────────────────────── */}
      <section className="bg-white px-4 py-16">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-orange-500">
          Transparent Pricing
        </p>
        <h2 className="mb-3 text-center text-2xl font-bold text-navy-900 md:text-3xl">
          Pay for Occupied Units.{" "}
          <span className="text-orange-500">Never for Empty Ones.</span>
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-sm text-neutral-600">
          AppFolio charges a $280 monthly minimum even when your units are empty.
          DoorLoop locks free tenant ACH behind their $209/month Premium tier.
          ResiGrid charges a low annual onboarding fee, then just $1/month per
          occupied unit — with zero tenant fees and zero feature gating.
        </p>
        <div className="mx-auto grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          <PricingTeaser name="Starter Grid" annualFee={40} capacity="1 Property · 20 Units" />
          <PricingTeaser name="Growth Grid" annualFee={80} capacity="5 Properties · 100 Units" highlighted />
          <PricingTeaser name="Mega Grid" annualFee={400} capacity="Unlimited Everything" />
        </div>
        <p className="mt-6 text-center text-sm text-neutral-500">
          Every tier includes all features.{" "}
          <Link href="/pricing" className="font-semibold text-orange-600 hover:text-orange-500">
            Compare plans →
          </Link>
        </p>
      </section>

      {/* ── Feature grid (platform overview) ─────────────────────── */}
      <section className="bg-neutral-50 px-4 py-16">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-orange-500">
          One unified platform
        </p>
        <h2 className="mb-12 text-center text-2xl font-bold text-navy-900 md:text-3xl">
          The Fair Data infrastructure for modern renting.
        </h2>
        <div className="mx-auto grid w-full max-w-4xl gap-6 sm:grid-cols-2 md:grid-cols-4">
          <Feature icon={Award} title="RGE Score" description="Every on-time payment is recorded on the RGE Ledger—a verifiable, portable trust score recognized across the platform." />
          <Feature icon={ShieldCheck} title="Immutable Reliability" description="Base leasing decisions on verified, secure payment ledgers—not fragmented credit scores or hearsay." />
          <Feature icon={Wrench} title="Automated Ecosystem" description="Collect rent, triage maintenance, and monitor your units in one unified, hardware-ready portal." />
          <Feature icon={BarChart3} title="Fair Pricing" description="Flat-rate, transparent fees for landlords. Zero convenience fees for tenants. No surprises—ever." />
        </div>
      </section>

      {/* ── Tenant value proposition (image band) — SECOND ─────────── */}
      <section
        className="relative w-full px-4 py-24 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,58,0.82), rgba(11,31,58,0.82)), url('${BG.tenant}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-orange-400">
          For Tenants
        </p>
        <h2 className="mx-auto max-w-2xl text-2xl font-bold text-orange-400 md:text-4xl">
          Stop Paying to Pay Rent.{" "}
          <span className="text-white">Start Building Your Future.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/75 md:text-base">
          Legacy platforms pass the buck—charging monthly transaction fees just to
          pay for the roof over your head. ResiGrid offers 100% fee-free ACH payments,
          and every on-time transaction builds your{" "}
          <span className="font-semibold text-orange-300">RGE Trust Profile</span>—a
          verifiable rental history that travels with you, bypassing outdated credit bureaus.
        </p>
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
          <TenantFeature icon={Wallet} title="Fee-Free Payments" desc="Keep your money. Standard digital rent transfers are always free—no exceptions." />
          <TenantFeature icon={Award} title="The RGE Score" desc="Turn consistency into currency. Prove your reliability to any landlord worldwide." />
          <TenantFeature icon={FileCheck} title="Data Sovereignty" desc="You own your Trust Profile. Generate an RGE Certificate to apply for your next home instantly." />
        </div>
        <Link
          href="/login?role=tenant"
          className="mt-10 inline-block rounded-lg bg-orange-500 px-7 py-3 text-sm font-bold text-white hover:bg-orange-600"
        >
          Claim your RGE Score
        </Link>
      </section>

      {/* ── Browse listings CTA band ──────────────────────────────── */}
      <section
        className="relative w-full px-4 py-24 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,58,0.88), rgba(11,31,58,0.88)), url('${BG.lifestyle}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-orange-400">
          Find your next home
        </p>
        <h2 className="mx-auto max-w-2xl text-2xl font-bold text-orange-400 md:text-4xl">
          Browse listings and build your{" "}
          <span className="text-white">RGE Trust Profile</span> from day one.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-white/70 md:text-base">
          Featured properties are managed by ResiGrid landlords—with instant
          applications, verified payment history, and direct messaging.
        </p>
        <Link
          href="/listings"
          className="mt-8 inline-block rounded-lg bg-orange-500 px-7 py-3 text-sm font-bold text-white hover:bg-orange-600"
        >
          Browse listings
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-navy-900 px-4 py-10 text-center text-sm text-white/60">
        <p className="mb-3 text-base font-bold tracking-wide">
          <span className="text-orange-400">ResiGrid</span>
          <span className="text-white/50"> &mdash; </span>
          <span className="text-white">Rent </span>
          <span className="text-orange-400">Payments</span>
          <span className="text-white/50"> &amp; </span>
          <span className="text-white">Property </span>
          <span className="text-orange-400">Management</span>
        </p>
        <p className="mb-1 text-xs text-white/50">
          The Residential Grid Economy &middot; Built on Fair Data
        </p>
        <p className="mb-4">
          Powered by{" "}
          <a href="https://www.illyrobotic-ai.com/" target="_blank" rel="noopener noreferrer" className="font-medium text-orange-400 hover:text-orange-300">
            Illy Robotic Instruments
          </a>
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-white/40">
          <Link href="/privacy" className="transition hover:text-orange-400">Privacy Policy</Link>
          <span className="text-white/20">·</span>
          <Link href="/pricing" className="transition hover:text-orange-400">Pricing</Link>
          <span className="text-white/20">·</span>
          <Link href="/listings" className="transition hover:text-orange-400">Browse Listings</Link>
          <span className="text-white/20">·</span>
          <Link href="/investors" className="transition hover:text-orange-400">Investors</Link>
          <span className="text-white/20">·</span>
          <Link href="/careers" className="transition hover:text-orange-400">Careers</Link>
          <span className="text-white/20">·</span>
          <Link href="/login" className="transition hover:text-orange-400">Sign In</Link>
        </div>
        <p className="mt-4 text-xs text-white/30">
          &copy; {new Date().getFullYear()} Illy Robotic Instruments. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, description }: { icon: typeof Award; title: string; description: string }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="rounded-xl bg-navy-900/8 p-3 text-navy-900">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-sm font-bold text-navy-900">{title}</h3>
      <p className="text-xs leading-relaxed text-neutral-600">{description}</p>
    </div>
  );
}

function PricingTeaser({ name, annualFee, capacity, highlighted = false }: { name: string; annualFee: number; capacity: string; highlighted?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-center ${highlighted ? "border-orange-400 bg-navy-900 text-white shadow-lg" : "border-neutral-200 bg-neutral-50"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${highlighted ? "text-orange-400" : "text-orange-500"}`}>{name}</p>
      <p className={`text-3xl font-bold ${highlighted ? "text-orange-400" : "text-navy-900"}`}>
        ${annualFee}
        <span className={`text-sm font-normal ${highlighted ? "text-white/60" : "text-neutral-500"}`}>/yr</span>
      </p>
      <p className={`text-xs ${highlighted ? "text-white/60" : "text-neutral-500"}`}>+ $1/mo per occupied unit</p>
      <p className={`mt-1 rounded-lg px-3 py-1 text-xs font-medium ${highlighted ? "bg-white/10 text-white" : "bg-orange-50 text-navy-900"}`}>{capacity}</p>
    </div>
  );
}

function TenantFeature({ icon: Icon, title, desc }: { icon: typeof Award; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm">
      <span className="rounded-full bg-orange-500/20 p-2.5 text-orange-400">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="text-xs leading-relaxed text-white/65">{desc}</p>
    </div>
  );
}
