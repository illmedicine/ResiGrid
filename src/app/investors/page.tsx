import Link from "next/link";
import { ArrowRight, BarChart3, TrendingUp, DollarSign, Zap, Target, Users } from "lucide-react";
import { PublicNavBar } from "@/components/layout/PublicNavBar";

const BG = {
  hero: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=80",
};

export default function InvestorsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[600px] flex-col items-center justify-center px-4 py-24 text-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(11,31,58,0.9) 0%, rgba(11,31,58,0.85) 100%), url('${BG.hero}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-orange-400">
          Investment Opportunity
        </p>
        <h1 className="mx-auto max-w-4xl text-3xl font-bold text-white md:text-5xl md:leading-tight">
          The <span className="text-orange-400">$11 Billion</span> Opportunity in Fragmented Property Management
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-sm text-white/80 md:text-base md:leading-relaxed">
          ResiGrid disrupts the $11 billion property management software market by capturing the 11 million independent landlords priced out by legacy incumbents. We're on pace to generate <span className="font-semibold text-orange-300">$2M in sales Year 1</span> with a capital-efficient, venture-scale go-to-market.
        </p>
        <Link
          href="#pitch"
          className="mt-8 inline-block rounded-lg bg-orange-500 px-7 py-3 text-sm font-bold text-white hover:bg-orange-600 transition"
        >
          View Investment Thesis →
        </Link>
      </section>

      {/* ── The Problem ──────────────────────────────────────────── */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-orange-500">
            The Broken Market
          </h2>
          <h3 className="mb-12 text-center text-3xl font-bold text-navy-900">
            Incumbents Dominate Through Extraction, Not Innovation
          </h3>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-6">
              <div className="text-4xl font-bold text-red-600">$280+</div>
              <h4 className="text-lg font-bold text-navy-900">Massive Minimums</h4>
              <p className="text-sm text-neutral-600">
                AppFolio forces a $280+ monthly minimum, freezing out millions of independent landlords.
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-6">
              <div className="text-4xl font-bold text-red-600">$2.49+</div>
              <h4 className="text-lg font-bold text-navy-900">Tenant Taxation</h4>
              <p className="text-sm text-neutral-600">
                Legacy software extracts $2.49+ in ACH fees from tenants just for the "privilege" of paying rent online.
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-6">
              <div className="text-4xl font-bold text-red-600">100%</div>
              <h4 className="text-lg font-bold text-navy-900">Paying for Emptiness</h4>
              <p className="text-sm text-neutral-600">
                Vacant units still incur monthly SaaS fees, destroying landlord margins during turnover.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Opportunity ──────────────────────────────────────── */}
      <section className="bg-neutral-50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-orange-500">
            Market Opportunity
          </h2>
          <h3 className="mb-12 text-center text-3xl font-bold text-navy-900">
            11 Million Landlords. Zero Barriers to Entry.
          </h3>
          <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="mb-4">
                <div className="text-5xl font-bold text-orange-500">11M</div>
                <p className="text-sm font-semibold text-neutral-600">Independent landlords own</p>
              </div>
              <div className="mb-4">
                <div className="text-5xl font-bold text-orange-500">16M</div>
                <p className="text-sm font-semibold text-neutral-600">Rental units in the U.S.</p>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                This massive demographic is completely locked out of AppFolio due to high monthly minimums. ResiGrid captures them instantly with <strong>zero onboarding barriers</strong> and transparent pricing.
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-navy-900 p-8 text-white">
              <h4 className="mb-4 text-2xl font-bold text-orange-400">ResiGrid's TAM</h4>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-orange-400">→</span>
                  <span>11 million independent landlords (1-50 units each)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-400">→</span>
                  <span>Average portfolio: 2-5 units per landlord</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-400">→</span>
                  <span>100% price-sensitive to $280/mo minimums</span>
                </div>
                <div className="mt-6 border-t border-white/20 pt-4">
                  <p className="text-xs text-white/70 mb-2">Addressable in Seed Round:</p>
                  <p className="text-xl font-bold text-orange-400">100K+ landlords with 500K+ units</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Solution ─────────────────────────────────────────── */}
      <section id="pitch" className="bg-white px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-orange-500">
            Our Competitive Advantage
          </h2>
          <h3 className="mb-12 text-center text-3xl font-bold text-navy-900">
            Three Pillars of Disruption
          </h3>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col gap-4 rounded-xl border border-orange-200 bg-orange-50 p-6">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500 text-white">
                <DollarSign className="h-6 w-6" />
              </span>
              <h4 className="text-lg font-bold text-navy-900">$1 Per Occupied Unit</h4>
              <p className="text-sm text-neutral-600">
                Flat annual onboarding fee + just $1/month per occupied unit. Vacant units = $0. Landlords only pay for what they use.
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-xs text-neutral-600">
                <li className="flex items-center gap-1.5"><span className="text-orange-500">✓</span> Zero tenant fees</li>
                <li className="flex items-center gap-1.5"><span className="text-orange-500">✓</span> No feature gating</li>
                <li className="flex items-center gap-1.5"><span className="text-orange-500">✓</span> Full transparency</li>
              </ul>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-orange-200 bg-orange-50 p-6">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500 text-white">
                <Zap className="h-6 w-6" />
              </span>
              <h4 className="text-lg font-bold text-navy-900">The RGE Score</h4>
              <p className="text-sm text-neutral-600">
                Portable, immutable tenant reputation ledger. Every on-time payment builds a trust profile that tenants own and carry forward.
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-xs text-neutral-600">
                <li className="flex items-center gap-1.5"><span className="text-orange-500">✓</span> Verified reliability</li>
                <li className="flex items-center gap-1.5"><span className="text-orange-500">✓</span> Reduces defaults</li>
                <li className="flex items-center gap-1.5"><span className="text-orange-500">✓</span> Network effects</li>
              </ul>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-orange-200 bg-orange-50 p-6">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500 text-white">
                <BarChart3 className="h-6 w-6" />
              </span>
              <h4 className="text-lg font-bold text-navy-900">Fair Data Ecosystem</h4>
              <p className="text-sm text-neutral-600">
                Built-in incentives for both landlords and tenants. No extraction—only alignment and transparency.
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-xs text-neutral-600">
                <li className="flex items-center gap-1.5"><span className="text-orange-500">✓</span> Lower churn</li>
                <li className="flex items-center gap-1.5"><span className="text-orange-500">✓</span> Sticky platform</li>
                <li className="flex items-center gap-1.5"><span className="text-orange-500">✓</span> Viral acquisition</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Financial Projections ────────────────────────────────── */}
      <section className="bg-neutral-50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-orange-500">
            Financial Model
          </h2>
          <h3 className="mb-12 text-center text-3xl font-bold text-navy-900">
            $2M Year 1 Revenue. Venture-Scale Unit Economics.
          </h3>
          <div className="grid gap-6 md:grid-cols-2 mb-12">
            <div className="rounded-xl border border-neutral-200 bg-white p-8">
              <h4 className="mb-4 text-sm font-semibold uppercase text-orange-500">Year 1 Projection</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Estimated Annual Revenue</span>
                  <span className="text-2xl font-bold text-navy-900">$2M+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Assumed Unit Count</span>
                  <span className="text-2xl font-bold text-navy-900">40K-50K</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Avg. Portfolio Size</span>
                  <span className="text-2xl font-bold text-navy-900">5-10 units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Customer CAC</span>
                  <span className="text-2xl font-bold text-green-600">$0-50</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-8">
              <h4 className="mb-4 text-sm font-semibold uppercase text-orange-500">Retention Economics</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Gross Margin Target</span>
                  <span className="text-2xl font-bold text-navy-900">85%+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Projected Churn</span>
                  <span className="text-2xl font-bold text-green-600">&lt;5% MRR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">LTV:CAC Ratio</span>
                  <span className="text-2xl font-bold text-navy-900">50:1+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Payback Period</span>
                  <span className="text-2xl font-bold text-green-600">&lt;2 months</span>
                </div>
              </div>
            </div>
          </div>

          {/* Birgo Case Study */}
          <div className="rounded-xl bg-navy-900 px-8 py-8 text-white">
            <h4 className="mb-4 text-lg font-bold text-orange-400">Case Study: Birgo Capital Portfolio</h4>
            <p className="mb-6 text-sm text-white/80">
              We've quantified the ROI on a 3,600-unit institutional portfolio:
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <p className="text-xs text-white/60">Current Cost (AppFolio)</p>
                <p className="text-3xl font-bold text-red-400">$129,600/yr</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-white/60">ResiGrid Cost</p>
                <p className="text-3xl font-bold text-green-400">$40,576/yr</p>
              </div>
            </div>
            <div className="mt-6 border-t border-white/20 pt-6">
              <p className="text-sm font-semibold text-orange-300">Annual Software Savings: $89,024</p>
              <p className="mt-2 text-xs text-white/70">
                A $100K seed investment to onboard Birgo's portfolio pays for itself in just 14 months via software savings alone—while securing equity upside.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use of Funds ─────────────────────────────────────────── */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-orange-500">
            Seed Round Allocation
          </h2>
          <h3 className="mb-12 text-center text-3xl font-bold text-navy-900">
            $100K Capital-Efficient Deployment
          </h3>
          <div className="grid gap-6 md:grid-cols-2 mb-12">
            <div className="rounded-xl border-2 border-orange-500 bg-orange-50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-bold">1</span>
                <h4 className="text-lg font-bold text-navy-900">Smart Home / IoT</h4>
              </div>
              <p className="text-sm text-neutral-600 mb-2">$40,000</p>
              <p className="text-xs text-neutral-600">
                Finalize edge-device access control, climate monitoring, and automated vacant unit alerts.
              </p>
            </div>
            <div className="rounded-xl border-2 border-orange-500 bg-orange-50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-bold">2</span>
                <h4 className="text-lg font-bold text-navy-900">Cloud Infrastructure</h4>
              </div>
              <p className="text-sm text-neutral-600 mb-2">$30,000</p>
              <p className="text-xs text-neutral-600">
                Fortify server capacity to scale the immutable RGE ledger globally for massive portfolios.
              </p>
            </div>
            <div className="rounded-xl border-2 border-orange-500 bg-orange-50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-bold">3</span>
                <h4 className="text-lg font-bold text-navy-900">Sales & Marketing</h4>
              </div>
              <p className="text-sm text-neutral-600 mb-2">$20,000</p>
              <p className="text-xs text-neutral-600">
                Target the 11 million independent landlords (1-5 units) with zero-minimum, fee-free campaigns.
              </p>
            </div>
            <div className="rounded-xl border-2 border-orange-500 bg-orange-50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-bold">4</span>
                <h4 className="text-lg font-bold text-navy-900">Legal & Compliance</h4>
              </div>
              <p className="text-sm text-neutral-600 mb-2">$10,000</p>
              <p className="text-xs text-neutral-600">
                Establish fair-data compliance frameworks and terms for the portable RGE Trust Profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="bg-orange-50 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-navy-900">Join the Grid.</h2>
          <p className="mb-8 text-sm text-neutral-600">
            Let's build the Residential Grid Economy together and reshape how millions of landlords manage their portfolios.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="mailto:dwilson@illyrobotic-ai.com?subject=ResiGrid%20Investment%20Inquiry"
              className="rounded-lg bg-orange-500 px-7 py-3 text-sm font-bold text-white hover:bg-orange-600 transition"
            >
              Schedule a Pitch
            </a>
            <Link
              href="https://www.illyrobotic-ai.com/"
              target="_blank"
              className="rounded-lg border border-orange-500 px-7 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50 transition"
            >
              Learn About Illy Robotic
            </Link>
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
