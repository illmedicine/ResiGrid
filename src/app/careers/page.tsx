import Link from "next/link";
import { Briefcase, DollarSign, Users, TrendingUp, Award, Zap } from "lucide-react";
import { PublicNavBar } from "@/components/layout/PublicNavBar";

const BG = {
  hero: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80",
};

export default function CareersPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[500px] flex-col items-center justify-center px-4 py-24 text-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(11,31,58,0.9) 0%, rgba(11,31,58,0.85) 100%), url('${BG.hero}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-orange-400">
          Join Our Team
        </p>
        <h1 className="mx-auto max-w-3xl text-3xl font-bold text-white md:text-5xl md:leading-tight">
          Build the Future of <span className="text-orange-400">Fair Property Management</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-sm text-white/80 md:text-base">
          We're hiring sales experts to capture a massive, underserved market of independent landlords.
        </p>
      </section>

      {/* ── Open Position ─────────────────────────────────────────── */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <span className="rounded-full bg-orange-100 p-3 text-orange-600">
                <Briefcase className="h-6 w-6" />
              </span>
              <h2 className="text-3xl font-bold text-navy-900">
                SaaS Property Management Sales Expert
              </h2>
            </div>
            <div className="mb-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2">
                <DollarSign className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-700">$40–$400/hour</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2">
                <Award className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">50% Lifetime Profit Share</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Residual Income</span>
              </div>
            </div>
          </div>

          {/* About ResiGrid */}
          <div className="mb-12">
            <h3 className="mb-4 text-2xl font-bold text-navy-900">About ResiGrid</h3>
            <p className="mb-4 text-neutral-600 leading-relaxed">
              <strong>ResiGrid, a flagship product of Illy Robotic Instruments</strong>, is a rapidly growing property management platform built for landlords who think in portfolios, not spreadsheets. We are on pace to generate <strong>$2 million in sales in our first 12 months</strong> because we are disrupting a massive market.
            </p>
            <p className="mb-4 text-neutral-600 leading-relaxed">
              Millions of independent to medium-sized property owners currently do not use end-to-end portfolio management solutions simply because legacy competitors are too expensive.
            </p>
            <p className="mb-4 text-neutral-600 leading-relaxed">
              We are changing that. We provide an ecosystem that establishes a <strong>Residential Grid Economy (RGE)</strong>, giving landlords the tools they need at a fraction of the cost of legacy systems like AppFolio and DoorLoop.
            </p>
            <p className="text-neutral-600 leading-relaxed">
              We are looking for veteran property managers and well-connected real estate hustlers to help us capture this massive market and shape our growing suite of capabilities.
            </p>
          </div>

          {/* The Opportunity */}
          <div className="mb-12 rounded-xl border-2 border-orange-200 bg-orange-50 p-8">
            <h3 className="mb-6 text-2xl font-bold text-navy-900">The Opportunity: 50% Lifetime Profit Share</h3>
            <p className="mb-6 text-neutral-600 leading-relaxed">
              We are offering an <strong>exclusive, unprecedented partnership for the first 50 Property Managers</strong> onboarded via referrals.
            </p>
            <p className="mb-6 text-neutral-600 leading-relaxed">
              As a <strong>Sales Expert</strong>, your mission is to market ResiGrid to landlords and building owners, assisting them in onboarding their property portfolios. In return, you will receive a <strong>50% profit split on the platform's annual onboarding fee</strong> for every client you bring in.
            </p>
            <div className="rounded-lg bg-white p-6 border border-orange-300">
              <p className="text-sm text-neutral-600 mb-3">
                Because the annual fee is an upfront payment that renews at the exact same rate each year, this translates to a <strong>lifetime residual profit share</strong> for as long as the client remains on the platform.
              </p>
              <p className="text-lg font-bold text-orange-600">
                No cap. No limit. Lifetime passive income.
              </p>
            </div>
          </div>

          {/* Why ResiGrid */}
          <div className="mb-12">
            <h3 className="mb-8 text-2xl font-bold text-navy-900">Why ResiGrid? The Product You'll Be Selling</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-navy-900/10 p-2 text-navy-900">
                    <Zap className="h-5 w-5" />
                  </span>
                  <h4 className="font-bold text-navy-900">Zero Feature Gating</h4>
                </div>
                <p className="text-sm text-neutral-600">
                  Unlike DoorLoop, which locks custom websites and free tenant ACH behind a $209/month premium tier, ResiGrid gives every tier the entire feature suite from day one.
                </p>
              </div>
              <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-navy-900/10 p-2 text-navy-900">
                    <DollarSign className="h-5 w-5" />
                  </span>
                  <h4 className="font-bold text-navy-900">Pay Only For What You Use</h4>
                </div>
                <p className="text-sm text-neutral-600">
                  We never charge for vacant units; landlords only pay $1 per month per occupied unit. Contrast to AppFolio ($280-$298/month minimum) and DoorLoop ($69/month minimum).
                </p>
              </div>
              <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-navy-900/10 p-2 text-navy-900">
                    <Award className="h-5 w-5" />
                  </span>
                  <h4 className="font-bold text-navy-900">Premium Tools Included</h4>
                </div>
                <p className="text-sm text-neutral-600">
                  Every plan includes AI Maintenance Triage, Smart Home Automation Readiness, and Automated Bill Payment & Payout Splits.
                </p>
              </div>
              <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-navy-900/10 p-2 text-navy-900">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                  <h4 className="font-bold text-navy-900">Seamless Operations</h4>
                </div>
                <p className="text-sm text-neutral-600">
                  Complete Lease Management & E-Sign, Secure Direct Messaging Portal, and Fee-Free Rent Collection (ACH).
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-lg bg-navy-900 p-6 text-white">
              <p className="text-sm mb-3 text-white/80">Unique selling point:</p>
              <p className="text-lg font-bold text-orange-400">
                RGE Trust Profile — a verified tenant network designed to attract tenants invested in protecting their reputation score, providing a reliable predictor of on-time payments.
              </p>
            </div>
          </div>

          {/* Earnings Potential */}
          <div className="mb-12">
            <h3 className="mb-8 text-2xl font-bold text-navy-900">Earnings Estimates & Compensation Structure</h3>
            <p className="mb-8 text-neutral-600">
              Your earnings are directly tied to the portfolios you onboard. The platform offers three tiers:
            </p>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-6">
                <p className="text-sm font-semibold text-orange-700 mb-2">Starter Grid</p>
                <p className="text-3xl font-bold text-orange-600">$40</p>
                <p className="text-xs text-neutral-600 mt-2">/year annual fee</p>
              </div>
              <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-6">
                <p className="text-sm font-semibold text-orange-700 mb-2">Growth Grid</p>
                <p className="text-3xl font-bold text-orange-600">$80</p>
                <p className="text-xs text-neutral-600 mt-2">/year annual fee</p>
              </div>
              <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-6">
                <p className="text-sm font-semibold text-orange-700 mb-2">Mega Grid</p>
                <p className="text-3xl font-bold text-orange-600">$400</p>
                <p className="text-xs text-neutral-600 mt-2">/year annual fee</p>
              </div>
            </div>

            <div className="mb-8 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <h4 className="mb-4 font-bold text-navy-900">Example Scenario: 1 Mega Grid Onboarded Per Week</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Upfront Payout</span>
                  <span className="text-lg font-bold text-green-600">$200</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Residual Payout (Every 12 months when client renews)</span>
                  <span className="text-lg font-bold text-green-600">$200/year</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="mb-4 font-bold text-navy-900">Weekly Pay Estimates (Based on 50% Upfront Splits)</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                  <p className="text-sm text-green-700 font-semibold mb-2">Low Tier</p>
                  <p className="text-2xl font-bold text-green-600">$40-$120/week</p>
                  <p className="text-xs text-neutral-600 mt-2">Onboarding 1-3 Starter/Growth Grids</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <p className="text-sm text-blue-700 font-semibold mb-2">Medium Tier</p>
                  <p className="text-2xl font-bold text-blue-600">$200-$600/week</p>
                  <p className="text-xs text-neutral-600 mt-2">Onboarding 1-3 Mega Grids</p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
                  <p className="text-sm text-orange-700 font-semibold mb-2">High Tier</p>
                  <p className="text-2xl font-bold text-orange-600">$1,000+/week</p>
                  <p className="text-xs text-neutral-600 mt-2">Onboarding 5+ Mega Grids</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-navy-900 p-6 text-white">
              <h4 className="mb-4 font-bold text-orange-400">Annual & Lifetime Maximum Earning Potential</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-white/70 mb-1">Year 1 Potential (1 Mega Grid/week)</p>
                  <p className="text-2xl font-bold">$10,400 in upfront commission</p>
                </div>
                <div className="border-t border-white/20 pt-4">
                  <p className="text-xs text-white/70 mb-1">Year 2+ (Lifetime Scaling)</p>
                  <p className="text-2xl font-bold mb-2">$20,800 total annual earnings</p>
                  <p className="text-xs text-white/60">$10,400 in new upfronts + $10,400 in residuals from Year 1 renewals</p>
                </div>
                <div className="border-t border-white/20 pt-4">
                  <p className="text-xs text-white/70 mb-1">Compounding Upside</p>
                  <p className="text-sm text-orange-300">
                    Because residuals stack for the lifetime of the account, there is no cap on your earning potential. Building a robust book of business will result in compounding, passive annual income.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Responsibilities */}
          <div className="mb-12">
            <h3 className="mb-6 text-2xl font-bold text-navy-900">Your Responsibilities</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <span className="mt-0.5 text-orange-500 font-bold">→</span>
                <span className="text-neutral-600">Leverage your existing network of independent to medium-sized realtors, property owners, and landlords</span>
              </li>
              <li className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <span className="mt-0.5 text-orange-500 font-bold">→</span>
                <span className="text-neutral-600">Conduct demos and present ResiGrid's value proposition against costly competitors</span>
              </li>
              <li className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <span className="mt-0.5 text-orange-500 font-bold">→</span>
                <span className="text-neutral-600">Assist landlords in smoothly onboarding their property portfolios onto the ResiGrid platform</span>
              </li>
              <li className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <span className="mt-0.5 text-orange-500 font-bold">→</span>
                <span className="text-neutral-600">Act as a feedback loop to our development team at Illy Robotic Instruments, helping to shape the future capabilities based on real-world landlord needs</span>
              </li>
            </ul>
          </div>

          {/* Requirements */}
          <div className="mb-12">
            <h3 className="mb-6 text-2xl font-bold text-navy-900">We're Looking For</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <span className="mt-0.5 text-green-600 font-bold">✓</span>
                <span className="text-neutral-600">Proven hustle and a strong background in property management, real estate sales, or B2B software sales</span>
              </li>
              <li className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <span className="mt-0.5 text-green-600 font-bold">✓</span>
                <span className="text-neutral-600">An established network of landlords, building owners, or property investors</span>
              </li>
              <li className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <span className="mt-0.5 text-green-600 font-bold">✓</span>
                <span className="text-neutral-600">Ability to work independently and manage your own sales pipeline</span>
              </li>
              <li className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <span className="mt-0.5 text-green-600 font-bold">✓</span>
                <span className="text-neutral-600">A strong understanding of the pain points landlords face with current portfolio management software</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-center text-white">
            <h3 className="mb-4 text-2xl font-bold">Ready to Build Generational Wealth?</h3>
            <p className="mb-6 text-white/90">
              Join us in reshaping the future of property management and earning lifetime residual income.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href="https://calendar.app.google/oEkAaEPLsJPKxkRGA"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white px-7 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50 transition"
              >
                Schedule a Call
              </a>
              <a
                href="https://resigrid.co"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white px-7 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
              >
                Check Out ResiGrid
              </a>
            </div>
          </div>
        </div>
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
          <Link href="/" className="transition hover:text-orange-400">Home</Link>
          <span className="text-white/20">·</span>
          <Link href="/pricing" className="transition hover:text-orange-400">Pricing</Link>
          <span className="text-white/20">·</span>
          <Link href="/investors" className="transition hover:text-orange-400">Investors</Link>
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
