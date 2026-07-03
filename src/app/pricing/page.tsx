import Link from "next/link";
import {
  Award,
  Bot,
  Building2,
  CheckCircle2,
  Home,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Wallet,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { FlipCounter } from "@/components/shared/FlipCounter";
import { PM_TIERS, TIER_ORDER } from "@/lib/pricing/fees";

const FEATURES = [
  { icon: Award, label: "RGE Trust Profile & Score" },
  { icon: Wallet, label: "Fee-Free Rent Collection (ACH)" },
  { icon: Smartphone, label: "Smart Home Automation Ready" },
  { icon: Bot, label: "AI Maintenance Triage" },
  { icon: ShieldCheck, label: "Complete Lease Management & E-Sign" },
  { icon: Home, label: "Property Marketing & Listing Syndication" },
  { icon: MessageSquare, label: "Secure Direct Messaging Portal" },
  { icon: Zap, label: "Automated Bill Payment & Payout Splits" },
  { icon: Building2, label: "Multi-Property Dashboard" },
  { icon: Wrench, label: "Maintenance Request Inbox" },
];

const PM_PROMISES = [
  {
    icon: Building2,
    title: "Only pay for occupied units",
    desc: "Your subscription covers the annual fee. The $1/mo unit fee only applies when a unit is occupied. Vacant = zero cost.",
  },
  {
    icon: ShieldCheck,
    title: "No feature gating — ever",
    desc: "Starter Grid gets the exact same feature set as Mega Grid. Your plan size affects capacity, never capability.",
  },
  {
    icon: Zap,
    title: "Transparent, predictable billing",
    desc: "Annual fee + (occupied units × $1/mo). That's the entire formula. No surprises, no platform cuts on rent.",
  },
  {
    icon: Award,
    title: "RGE-verified tenant network",
    desc: "Attract tenants invested in protecting their RGE score — the most reliable predictor of on-time payments.",
  },
];

const TIER_HIGHLIGHT: Record<string, boolean> = { growth: true };

export default function PricingPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <PublicNavBar />
      <FlipCounter />

      {/* ── PM Promise Banner ─────────────────────────────────────── */}
      <div className="bg-orange-500 px-4 py-3 text-center">
        <p className="text-sm font-semibold text-white">
          <span className="font-bold">The Landlord Promise</span>
          {" · "}
          No per-unit charge for vacant units.{" "}
          <span className="text-white/75 text-xs">
            All features included on every plan. No feature gating. No platform cut on rent collected.
          </span>
        </p>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-navy-900 px-4 pb-16 pt-12 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-orange-400">
          For Property Owners &amp; Managers
        </p>
        <h1 className="mx-auto max-w-2xl text-3xl font-bold text-white md:text-4xl">
          Built for Landlords Who Think in{" "}
          <span className="text-orange-400">Portfolios, Not Spreadsheets.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 md:text-base">
          A single annual onboarding fee to join the Grid, then exactly{" "}
          <strong className="text-orange-300">$1 per month</strong> per occupied
          unit. Vacant units cost you nothing. Every premium feature included — no
          upsells, no nickel-and-diming.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup?role=property_manager"
            className="rounded-xl bg-orange-500 px-7 py-3 text-sm font-bold text-white hover:bg-orange-600"
          >
            Start free — no credit card
          </Link>
          <Link
            href="/login?role=property_manager"
            className="rounded-xl border border-white/20 px-7 py-3 text-sm font-semibold text-white/80 hover:border-white/50 hover:text-white"
          >
            Sign in to your portfolio
          </Link>
        </div>
      </section>

      {/* ── Pricing Cards ─────────────────────────────────────────── */}
      <section className="mx-auto -mt-8 grid w-full max-w-5xl gap-5 px-4 pb-16 md:grid-cols-3">
        {TIER_ORDER.map((tierId) => {
          const tier = PM_TIERS[tierId];
          const highlighted = TIER_HIGHLIGHT[tierId];
          return (
            <div
              key={tierId}
              className={`relative flex flex-col rounded-2xl border p-6 shadow-lg ${
                highlighted
                  ? "border-orange-400 bg-navy-900 text-white"
                  : "border-neutral-200 bg-white"
              }`}
            >
              {highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-4 py-1 text-xs font-bold text-white shadow">
                  Most Popular
                </div>
              )}

              <p className={`text-xs font-semibold uppercase tracking-widest ${highlighted ? "text-orange-400" : "text-orange-500"}`}>
                {tier.name}
              </p>
              <p className={`mt-1 text-sm ${highlighted ? "text-white/70" : "text-neutral-500"}`}>
                {tier.tagline}
              </p>

              <div className="mt-5">
                <span className={`text-4xl font-bold ${highlighted ? "text-orange-400" : "text-navy-900"}`}>
                  ${tier.annualFee}
                </span>
                <span className={`ml-1 text-sm ${highlighted ? "text-white/60" : "text-neutral-500"}`}>
                  / year
                </span>
              </div>
              <div className={`mt-1 text-xs ${highlighted ? "text-white/60" : "text-neutral-500"}`}>
                + $1 / month per occupied unit
              </div>

              <div className={`mt-4 rounded-lg px-3 py-2 text-xs font-medium ${highlighted ? "bg-white/10 text-white" : "bg-orange-50 text-navy-900"}`}>
                {tier.capacityLabel}
              </div>

              <ul className="mt-5 flex flex-col gap-2 text-xs">
                <FeatureItem text="All premium features included" highlighted={highlighted} bold />
                <FeatureItem text="$0 tenant ACH fee — always" highlighted={highlighted} />
                <FeatureItem text="No charge for vacant units" highlighted={highlighted} />
                <FeatureItem text="No feature gating" highlighted={highlighted} />
                <FeatureItem text="RGE tenant screening network" highlighted={highlighted} />
              </ul>

              <Link
                href="/signup?role=property_manager"
                className={`mt-6 block rounded-xl py-3 text-center text-sm font-bold transition ${
                  highlighted
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-navy-900 text-white hover:bg-navy-900/90"
                }`}
              >
                Get started free
              </Link>
            </div>
          );
        })}
      </section>

      {/* ── PM Promise Grid ───────────────────────────────────────── */}
      <section className="bg-navy-900 px-4 py-16">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-orange-400">
          The Landlord Promise
        </p>
        <h2 className="mb-10 text-center text-2xl font-bold text-white md:text-3xl">
          Pricing that actually{" "}
          <span className="text-orange-400">works for you.</span>
        </h2>
        <div className="mx-auto grid w-full max-w-4xl gap-6 sm:grid-cols-2 md:grid-cols-4">
          {PM_PROMISES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
              <span className="rounded-xl bg-orange-500/20 p-2.5 text-orange-400">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs text-white/60 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── No Gated Features ─────────────────────────────────────── */}
      <section className="bg-white px-4 py-16">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-orange-500">
          The No-Gating Guarantee
        </p>
        <h2 className="mb-2 text-center text-2xl font-bold text-navy-900 md:text-3xl">
          Every Tier Gets Everything
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-sm text-neutral-600">
          Unlike DoorLoop — which locks free tenant ACH and custom websites behind their
          $209/month Premium tier — ResiGrid gives you our entire feature suite from day
          one, on every plan.
        </p>
        <div className="mx-auto grid w-full max-w-4xl gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-center">
              <span className="rounded-full bg-orange-100 p-2.5 text-orange-600">
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-xs font-medium text-navy-900">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Competitor Comparison ─────────────────────────────────── */}
      <section className="bg-neutral-50 px-4 py-16">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-orange-500">
          How we compare
        </p>
        <h2 className="mb-10 text-center text-2xl font-bold text-navy-900 md:text-3xl">
          Stop Paying for Vacant Units. Stop Gating Features.
        </h2>
        <div className="mx-auto max-w-4xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="pb-4 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500" />
                <th className="pb-4 pr-4 text-center text-xs font-semibold uppercase tracking-wider text-neutral-500">DoorLoop</th>
                <th className="pb-4 pr-4 text-center text-xs font-semibold uppercase tracking-wider text-neutral-500">AppFolio</th>
                <th className="pb-4 text-center text-xs font-semibold uppercase tracking-wider text-orange-500">ResiGrid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              <CompareRow label="Entry price" doorloop="$69/month (≤20 units)" appfolio="$280–$298/month minimum" resigrid="$40/year + $1/mo per occupied unit" resigridWins />
              <CompareRow label="Tenant ACH fee" doorloop="Charged unless $209/mo Premium" appfolio="$2.49 per payment" resigrid="$0.00 — always free" resigridWins />
              <CompareRow label="Pay for vacant units?" doorloop="Yes — billed regardless" appfolio="Yes — minimum applies" resigrid="Never — only occupied units billed" resigridWins />
              <CompareRow label="Feature gating" doorloop="Yes — best features need $109–$209/mo" appfolio="Complex tiered unlocks" resigrid="None — all features on every tier" resigridWins />
              <CompareRow label="RGE reputation network" doorloop="—" appfolio="—" resigrid="Included on every tier" resigridWins />
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Monthly math ──────────────────────────────────────────── */}
      <section className="bg-navy-900 px-4 py-16 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-orange-400">
          The math is simple
        </p>
        <h2 className="mx-auto max-w-2xl text-2xl font-bold text-white md:text-3xl">
          10 occupied units costs{" "}
          <span className="text-orange-400">$10/month.</span>
          <br />
          AppFolio charges{" "}
          <span className="text-red-400">$280/month minimum.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/70">
          ResiGrid is the only platform where your cost scales perfectly with your
          revenue. Empty units cost you nothing. Scale with occupancy, not unit count.
        </p>
        <Link
          href="/signup?role=property_manager"
          className="mt-8 inline-block rounded-xl bg-orange-500 px-8 py-3 text-sm font-bold text-white hover:bg-orange-600"
        >
          Start your free 3-day trial
        </Link>
        <p className="mt-3 text-xs text-white/40">No credit card required to start. Cancel anytime.</p>
      </section>

      {/* ── Tenant Promise (secondary) ────────────────────────────── */}
      <section className="bg-white px-4 py-16 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-orange-500">
          What about your renters?
        </p>
        <h2 className="mx-auto max-w-xl text-2xl font-bold text-navy-900 md:text-3xl">
          Cost to pay rent online:{" "}
          <span className="text-orange-500">$0.00</span>
          <span className="text-neutral-400"> — forever.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-neutral-600">
          Standard ACH transfers are always free for your tenants — no exceptions.
          Tenant-facing fees are the number one reason renters resist property portals.
          Eliminate the friction entirely. When your tenants pay for free, they pay on time.
        </p>
        <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
          <PromisePill text="$0 ACH fee" />
          <PromisePill text="No convenience fees" />
          <PromisePill text="Builds RGE reputation score" />
        </div>
        <Link
          href="/login?role=tenant"
          className="mt-8 inline-block rounded-xl border border-navy-900/20 bg-neutral-50 px-7 py-3 text-sm font-semibold text-navy-900 hover:bg-orange-50"
        >
          Share with your tenants →
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-navy-900 border-t border-white/10 px-4 py-8 text-center text-xs text-white/40">
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="transition hover:text-orange-400">Home</Link>
          <span className="text-white/20">·</span>
          <Link href="/listings" className="transition hover:text-orange-400">Browse Listings</Link>
          <span className="text-white/20">·</span>
          <Link href="/login" className="transition hover:text-orange-400">Sign In</Link>
          <span className="text-white/20">·</span>
          <Link href="/privacy" className="transition hover:text-orange-400">Privacy</Link>
        </div>
        <p className="mt-4">&copy; {new Date().getFullYear()} Illy Robotic Instruments. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureItem({ text, highlighted, bold }: { text: string; highlighted: boolean; bold?: boolean }) {
  return (
    <li className="flex items-start gap-1.5">
      <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${highlighted ? "text-orange-400" : "text-orange-500"}`} />
      <span className={`${highlighted ? "text-white/80" : "text-neutral-700"} ${bold ? "font-semibold" : ""}`}>
        {text}
      </span>
    </li>
  );
}

function PromisePill({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-500" />
      <span className="text-sm font-semibold text-navy-900">{text}</span>
    </div>
  );
}

function CompareRow({
  label, doorloop, appfolio, resigrid, resigridWins,
}: {
  label: string; doorloop: string; appfolio: string; resigrid: string; resigridWins?: boolean;
}) {
  return (
    <tr>
      <td className="py-3.5 pr-4 text-xs font-semibold text-navy-900">{label}</td>
      <td className="py-3.5 pr-4 text-center">
        <span className="inline-flex items-center gap-1 text-xs text-red-600"><X className="h-3 w-3 shrink-0" />{doorloop}</span>
      </td>
      <td className="py-3.5 pr-4 text-center">
        <span className="inline-flex items-center gap-1 text-xs text-red-600"><X className="h-3 w-3 shrink-0" />{appfolio}</span>
      </td>
      <td className="py-3.5 text-center">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${resigridWins ? "text-green-600" : "text-neutral-600"}`}>
          <CheckCircle2 className="h-3 w-3 shrink-0" />{resigrid}
        </span>
      </td>
    </tr>
  );
}
