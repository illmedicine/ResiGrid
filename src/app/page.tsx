import Link from "next/link";
import {
  Banknote,
  KeyRound,
  MessageSquareLock,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { Card, CardContent } from "@/components/ui/Card";

// Unsplash image helper — always paired with a navy overlay so content
// remains readable even if an image fails to load.
const BG = {
  hero: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80",
  tour: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1920&q=80",
  lifestyle: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1920&q=80",
  city: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1920&q=80",
};

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[600px] flex-col items-center justify-center px-4 py-24 text-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(11,31,58,0.82) 0%, rgba(11,31,58,0.72) 60%, rgba(11,31,58,0.92) 100%), url('${BG.hero}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1 className="mx-auto max-w-3xl text-3xl font-bold text-white md:text-5xl md:leading-tight">
          Rent payments, reputation, and property management —&nbsp;in one place.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm text-white/75 md:text-base">
          ResiGrid lets tenants pay rent — even to landlords who aren&apos;t
          on the platform — while building a payment history that follows them
          from lease to lease.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup?role=tenant"
            className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600"
          >
            I&apos;m a Tenant
          </Link>
          <Link
            href="/signup?role=property_manager"
            className="rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
          >
            I&apos;m a Property Manager
          </Link>
        </div>
      </section>

      {/* ── Portal choice cards ───────────────────────────────────────── */}
      <section className="mx-auto -mt-8 grid w-full max-w-4xl gap-4 px-4 pb-12 sm:grid-cols-2 md:-mt-10">
        <Link href="/signup?role=tenant" className="block">
          <Card className="h-full p-6 transition-all hover:shadow-xl hover:-translate-y-1">
            <CardContent className="flex flex-col items-start gap-3 p-0">
              <span className="rounded-full bg-orange-100 p-3 text-orange-600">
                <KeyRound className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-semibold text-navy-900">
                I&apos;m a Tenant
              </h2>
              <p className="text-sm text-neutral-600">
                Pay rent, search for apartments, submit maintenance requests,
                and build your rent payment reputation.
              </p>
              <span className="mt-2 text-sm font-medium text-orange-600">
                Get started →
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/signup?role=property_manager" className="block">
          <Card className="h-full p-6 transition-all hover:shadow-xl hover:-translate-y-1">
            <CardContent className="flex flex-col items-start gap-3 p-0">
              <span className="rounded-full bg-navy-900/10 p-3 text-navy-900">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-semibold text-navy-900">
                I&apos;m a Property Manager
              </h2>
              <p className="text-sm text-neutral-600">
                Manage properties, units, leases, and tenants — collect
                payments and screen applicants by reputation score.
              </p>
              <span className="mt-2 text-sm font-medium text-orange-600">
                Get started →
              </span>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* ── Image band 1: apartment tour ─────────────────────────────── */}
      <section
        className="relative w-full py-24 px-4 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,58,0.78), rgba(11,31,58,0.78)), url('${BG.tour}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-orange-400">
          Find your next home
        </p>
        <h2 className="mx-auto max-w-2xl text-2xl font-bold text-white md:text-4xl">
          Browse listings from verified property managers
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-white/70 md:text-base">
          Featured properties on ResiGrid include easy scheduling for viewings,
          instant applications, and direct messaging with the owner — all in one
          place.
        </p>
        <Link
          href="/listings"
          className="mt-8 inline-block rounded-lg bg-orange-500 px-7 py-3 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Browse listings
        </Link>
      </section>

      {/* ── Feature grid ─────────────────────────────────────────────── */}
      <section className="bg-neutral-50 px-4 py-16">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-orange-500">
          Everything you need
        </p>
        <h2 className="mb-12 text-center text-2xl font-bold text-navy-900 md:text-3xl">
          One platform. Two portals.
        </h2>
        <div className="mx-auto grid w-full max-w-4xl gap-6 sm:grid-cols-2 md:grid-cols-4">
          <Feature
            icon={Banknote}
            title="Pay anyone"
            description="Pay rent by card even if your landlord isn't on ResiGrid — they claim it via a secure voucher link."
          />
          <Feature
            icon={ShieldCheck}
            title="Reputation & badges"
            description="On-time payment history and badges that property managers can see when you apply."
          />
          <Feature
            icon={Wrench}
            title="Maintenance requests"
            description="Submit and track maintenance requests for your unit, by room or appliance."
          />
          <Feature
            icon={MessageSquareLock}
            title="Secure messaging"
            description="Message your landlord or tenant directly, saved and encrypted in the platform."
          />
        </div>
      </section>

      {/* ── Image band 2: lifestyle / happy renters ───────────────────── */}
      <section
        className="relative w-full py-24 px-4 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,58,0.75), rgba(242,121,29,0.35)), url('${BG.lifestyle}')`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundAttachment: "fixed",
        }}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-orange-300">
          Build your reputation
        </p>
        <h2 className="mx-auto max-w-2xl text-2xl font-bold text-white md:text-4xl">
          Your payment history moves with you
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-white/75 md:text-base">
          Every on-time payment earns you prestige badges and boosts your tenant
          score — making your next rental application stand out from day one.
        </p>
        <Link
          href="/signup?role=tenant"
          className="mt-8 inline-block rounded-lg bg-white px-7 py-3 text-sm font-semibold text-navy-900 hover:bg-orange-100"
        >
          Start building your score
        </Link>
      </section>

      {/* ── Image band 3: city / move-in ─────────────────────────────── */}
      <section
        className="relative w-full py-24 px-4 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,58,0.85), rgba(11,31,58,0.85)), url('${BG.city}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-orange-400">
          For property managers
        </p>
        <h2 className="mx-auto max-w-2xl text-2xl font-bold text-white md:text-4xl">
          Manage your entire portfolio in one dashboard
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-white/70 md:text-base">
          Publish listings, screen applicants by reputation score, manage leases,
          collect rent, and handle maintenance — all without switching tools.
        </p>
        <Link
          href="/signup?role=property_manager"
          className="mt-8 inline-block rounded-lg bg-orange-500 px-7 py-3 text-sm font-semibold text-white hover:bg-orange-600"
        >
          List your properties
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-navy-900 px-4 py-10 text-center text-sm text-white/60">
        <p className="mb-3 font-semibold text-white">
          ResiGrid &mdash; Rent Payments &amp; Property Management
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
        <div className="flex items-center justify-center gap-4 text-xs text-white/50">
          <Link href="/privacy" className="hover:text-white">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link href="/listings" className="hover:text-white">
            Browse Listings
          </Link>
          <span>·</span>
          <Link href="/login" className="hover:text-white">
            Log in
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
  icon: typeof Banknote;
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
