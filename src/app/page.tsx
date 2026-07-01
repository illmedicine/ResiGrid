import Link from "next/link";
import {
  Award,
  BarChart3,
  Building2,
  FileCheck,
  ShieldCheck,
  Wallet,
  Wrench,
} from "lucide-react";
import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { HeroCTAs } from "@/components/layout/HeroCTAs";
import { Card, CardContent } from "@/components/ui/Card";

const BG = {
  hero:      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80",
  tenant:    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1920&q=80",
  lifestyle: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1920&q=80",
  city:      "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1920&q=80",
};

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />

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
          Your Rent. Your Reputation.{" "}
          <span className="text-white">Zero &ldquo;Convenience&rdquo; Fees.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm text-white/80 md:text-base md:leading-relaxed">
          ResiGrid is the world&apos;s only property management platform built on{" "}
          <span className="font-semibold text-orange-300">Fair Data</span>. We
          transform on-time payments into a globally recognized{" "}
          <span className="font-semibold text-orange-300">RGE Score</span>—empowering
          tenants with a portable reputation, while giving landlords mathematically
          proven reliability, all without the hidden fees of legacy software.
        </p>
        <HeroCTAs />
      </section>

      {/* ── Portal choice cards ───────────────────────────────────── */}
      <section className="mx-auto -mt-8 grid w-full max-w-4xl gap-4 px-4 pb-12 sm:grid-cols-2 md:-mt-10">
        <Link href="/login?role=tenant" className="block">
          <Card className="h-full p-6 transition-all hover:shadow-xl hover:-translate-y-1">
            <CardContent className="flex flex-col items-start gap-3 p-0">
              <span className="rounded-full bg-orange-100 p-3 text-orange-600">
                <Wallet className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-bold text-navy-900">I&apos;m a Tenant</h2>
              <p className="text-sm text-neutral-600">
                Stop paying to pay rent. Fee-free transfers, a portable RGE Trust
                Profile, and a reputation that works harder than any credit bureau.
              </p>
              <span className="mt-2 text-sm font-semibold text-orange-600">
                Join the Grid →
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/login?role=property_manager" className="block">
          <Card className="h-full p-6 transition-all hover:shadow-xl hover:-translate-y-1">
            <CardContent className="flex flex-col items-start gap-3 p-0">
              <span className="rounded-full bg-navy-900/10 p-3 text-navy-900">
                <Building2 className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-bold text-navy-900">
                I&apos;m a Property Manager
              </h2>
              <p className="text-sm text-neutral-600">
                Zero-risk leasing backed by the RGE Ledger. Attract motivated,
                reliable tenants and manage your entire portfolio in one place.
              </p>
              <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-orange-600">
                Start free for 3 days →
              </span>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* ── Tenant value proposition (image band) ────────────────── */}
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
          pay for the roof over your head. We believe your data and your money belong
          to you. ResiGrid offers 100% fee-free ACH payments, and every on-time
          transaction builds your <span className="font-semibold text-orange-300">RGE Trust Profile</span>—a
          verifiable rental history that travels with you, bypassing outdated credit bureaus.
        </p>
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
          <TenantFeature
            icon={Wallet}
            title="Fee-Free Payments"
            desc="Keep your money. Standard digital rent transfers are always free—no exceptions."
          />
          <TenantFeature
            icon={Award}
            title="The RGE Score"
            desc="Turn consistency into currency. Prove your reliability to any landlord worldwide."
          />
          <TenantFeature
            icon={FileCheck}
            title="Data Sovereignty"
            desc="You own your Trust Profile. Generate an RGE Certificate to apply for your next home instantly."
          />
        </div>
        <Link
          href="/login?role=tenant"
          className="mt-10 inline-block rounded-lg bg-orange-500 px-7 py-3 text-sm font-bold text-white hover:bg-orange-600"
        >
          Claim your RGE Score
        </Link>
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
          <Feature
            icon={Award}
            title="RGE Score"
            description="Every on-time payment is recorded on the RGE Ledger—a verifiable, portable trust score recognized across the platform."
          />
          <Feature
            icon={ShieldCheck}
            title="Immutable Reliability"
            description="Base leasing decisions on verified, secure payment ledgers—not fragmented credit scores or hearsay."
          />
          <Feature
            icon={Wrench}
            title="Automated Ecosystem"
            description="Collect rent, triage maintenance, and monitor your units in one unified, hardware-ready portal."
          />
          <Feature
            icon={BarChart3}
            title="Fair Pricing"
            description="Flat-rate, transparent fees for landlords. Zero convenience fees for tenants. No surprises—ever."
          />
        </div>
      </section>

      {/* ── PM value proposition (image band) ────────────────────── */}
      <section
        className="relative w-full px-4 py-24 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,58,0.78), rgba(242,121,29,0.25)), url('${BG.lifestyle}')`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
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
          <TenantFeature
            icon={ShieldCheck}
            title="Immutable Reliability"
            desc="Verified, secure payment ledgers—not fragmented credit scores."
          />
          <TenantFeature
            icon={Award}
            title="Lower Turnover"
            desc="RGE-verified tenants are invested in their score and your property."
          />
          <TenantFeature
            icon={Building2}
            title="Automated Ecosystem"
            desc="Rent collection, maintenance triage, and unit monitoring in one portal."
          />
        </div>
        <Link
          href="/login?role=property_manager"
          className="mt-10 inline-block rounded-lg bg-white px-7 py-3 text-sm font-bold text-navy-900 hover:bg-orange-100"
        >
          Start your free 3-day trial
        </Link>
      </section>

      {/* ── Browse listings CTA band ──────────────────────────────── */}
      <section
        className="relative w-full px-4 py-24 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,58,0.88), rgba(11,31,58,0.88)), url('${BG.city}')`,
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
          applications, verified payment history, and direct messaging. Every property
          you apply to sees your RGE Score, not a stale credit report.
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
          <a
            href="https://www.illyrobotic-ai.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-orange-400 hover:text-orange-300"
          >
            Illy Robotic Instruments
          </a>
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-white/40">
          <Link href="/privacy" className="transition hover:text-orange-400">
            Privacy Policy
          </Link>
          <span className="text-white/20">·</span>
          <Link href="/listings" className="transition hover:text-orange-400">
            Browse Listings
          </Link>
          <span className="text-white/20">·</span>
          <Link href="/login" className="transition hover:text-orange-400">
            Sign In
          </Link>
        </div>
        <p className="mt-4 text-xs text-white/30">
          &copy; {new Date().getFullYear()} Illy Robotic Instruments. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Award;
  title: string;
  description: string;
}) {
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

function TenantFeature({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Award;
  title: string;
  desc: string;
}) {
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
