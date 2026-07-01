"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ── Tab definitions ───────────────────────────────────────────────── */
const TABS = [
  { id: "score",   label: "The RGE Score"        },
  { id: "tenant",  label: "Tenant Initiates"      },
  { id: "pm",      label: "Landlord Invites"       },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ── Score breakdown ───────────────────────────────────────────────── */
const SCORE_BARS = [
  { label: "On-Time Payments",   pct: 60, color: "bg-orange-500",  note: "Most important — every on-time payment adds directly to the RGE Ledger." },
  { label: "Platform Tenure",    pct: 15, color: "bg-navy-600",    note: "The longer you're on ResiGrid, the more trust you've demonstrated over time." },
  { label: "Invite Contributions", pct: 15, color: "bg-orange-400", note: "Bringing landlords or tenants onto the platform earns you verifiable contribution credit." },
  { label: "Engagement",         pct: 10, color: "bg-navy-500",    note: "Active use of leases, maintenance, and messaging signals a responsible participant." },
];

/* ── Flow steps ────────────────────────────────────────────────────── */
const TENANT_STEPS = [
  { emoji: "🏠", color: "border-orange-400 bg-orange-500/10 text-orange-400", heading: "Tenant Signs Up — Free", body: "No card, no fee. Your RGE score starts building the moment you join the Residential Grid Economy." },
  { emoji: "💳", color: "border-orange-400 bg-orange-500/10 text-orange-400", heading: "Pay Rent via ResiGrid", body: "Pay your landlord even if they're not on the platform yet. ResiGrid generates a secure claim link for them automatically." },
  { emoji: "📧", color: "border-neutral-400 bg-white/5 text-white",           heading: "Landlord Receives Claim Link", body: "Landlord claims their payment via the link — no ResiGrid account required to receive funds. But now they've seen the platform." },
  { emoji: "⭐", color: "border-orange-400 bg-orange-500/10 text-orange-400", heading: "Invite Credit Earned", body: "Your RGE Score immediately records an Invite Contribution — proof you brought a new stakeholder onto the grid." },
  { emoji: "🏢", color: "border-orange-300 bg-orange-500/10 text-orange-300", heading: "Landlord Discovers PM Features", body: "Impressed by the automation, the landlord creates a full PM account — unlocking listings, leases, maintenance, and RGE screening." },
];

const PM_STEPS = [
  { emoji: "🏢", color: "border-navy-400 bg-navy-800 text-white",             heading: "PM Lists Property on ResiGrid", body: "Property manager activates their account ($40 one-time), publishes the listing, and gets an instant shareable application link." },
  { emoji: "🔗", color: "border-navy-400 bg-navy-800 text-white",             heading: "PM Shares the Link", body: "Send the listing link via text, email, or social. Prospective tenants tap it and land directly on the property's ResiGrid page." },
  { emoji: "👤", color: "border-orange-400 bg-orange-500/10 text-orange-400", heading: "Tenant Applies with RGE Score", body: "Tenant submits their application with their verified RGE Trust Profile attached — no paper, no credit bureau pull required." },
  { emoji: "📋", color: "border-navy-400 bg-navy-800 text-white",             heading: "PM Reviews Score & Sends Lease", body: "PM screens applicants by RGE Score, selects their top pick, and sends a fully customised lease agreement with one click." },
  { emoji: "✅", color: "border-orange-400 bg-orange-500/10 text-orange-400", heading: "Tenant Signs, Pays & Earns", body: "Tenant e-signs, pays rent monthly through ResiGrid, and every on-time payment increments their RGE Score automatically." },
];

/* ── Component ─────────────────────────────────────────────────────── */
interface RGEScoreModalProps {
  open: boolean;
  onClose: () => void;
}

export function RGEScoreModal({ open, onClose }: RGEScoreModalProps) {
  const [tab, setTab] = useState<TabId>("score");
  const [visibleScore, setVisibleScore] = useState(false);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = tab === "tenant" ? TENANT_STEPS : PM_STEPS;

  // Animate score bars when score tab is active
  useEffect(() => {
    if (!open || tab !== "score") { setVisibleScore(false); return; }
    const t = setTimeout(() => setVisibleScore(true), 200);
    return () => clearTimeout(t);
  }, [open, tab]);

  // Auto-advance steps
  useEffect(() => {
    if (tab === "score" || !open || paused) return;
    setStep(0);
    intervalRef.current = setInterval(() => {
      setStep((s) => {
        if (s >= steps.length - 1) { setPaused(true); return s; }
        return s + 1;
      });
    }, 2400);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tab, open, paused, steps.length]);

  function changeTab(t: TabId) {
    setTab(t);
    setStep(0);
    setPaused(false);
  }

  function prev() { setPaused(true); setStep((s) => Math.max(0, s - 1)); }
  function next() { setPaused(true); setStep((s) => Math.min(steps.length - 1, s + 1)); }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,11,22,0.88)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-navy-900 shadow-2xl"
        style={{ animation: "modalIn 0.3s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-400">
              Residential Grid Economy
            </p>
            <h2 className="text-lg font-bold text-white">How the RGE Score Works</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => changeTab(t.id)}
              className={cn(
                "flex-1 px-3 py-3 text-xs font-semibold transition",
                tab === t.id
                  ? "border-b-2 border-orange-500 text-orange-400"
                  : "text-white/50 hover:text-white/80",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Score tab ── */}
        {tab === "score" && (
          <div className="px-6 py-6">
            <div className="mb-6 flex items-center gap-4">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-orange-500"
                style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
              >
                <div className="text-center">
                  <div className="text-xl font-black text-orange-400">RGE</div>
                  <div className="text-[10px] font-bold text-white/60">SCORE</div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  A Fair Data score built entirely on what you <em>do</em> — not what banks say about you.
                </p>
                <p className="mt-1 text-xs text-white/55">
                  Every on-time payment, every month of tenure, every new participant you bring to the grid
                  is permanently recorded on the RGE Ledger and visible to every landlord who screens you.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {SCORE_BARS.map((bar, i) => (
                <div key={bar.label}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{bar.label}</span>
                    <span className="text-xs font-bold text-orange-400">{bar.pct}%</span>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-700", bar.color)}
                      style={{
                        width: visibleScore ? `${bar.pct}%` : "0%",
                        transitionDelay: `${i * 150}ms`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-white/50">{bar.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Flow tabs (tenant / pm) ── */}
        {tab !== "score" && (
          <div className="px-6 py-6">
            <p className="mb-5 text-xs text-white/55">
              {tab === "tenant"
                ? "A tenant pays their landlord via ResiGrid before the landlord even has an account — and earns invite credit for doing it."
                : "A property manager lists their property and shares a direct link — tenants apply, sign leases, and pay rent all in one place."}
            </p>

            {/* Step dots */}
            <div className="mb-5 flex items-center justify-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setPaused(true); setStep(i); }}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === step ? "h-2 w-6 bg-orange-500" : "h-2 w-2 bg-white/20 hover:bg-white/40",
                  )}
                />
              ))}
            </div>

            {/* Active step */}
            {steps.map((s, i) => (
              <div
                key={i}
                className={cn(
                  "transition-all duration-500",
                  i === step ? "opacity-100" : "pointer-events-none absolute opacity-0",
                )}
              >
                {i === step && (
                  <div
                    className={cn(
                      "rounded-xl border-2 p-5 text-center",
                      s.color,
                    )}
                    style={{ animation: "stepIn 0.4s ease-out" }}
                  >
                    <div className="mb-3 text-4xl">{s.emoji}</div>
                    <h3 className="mb-2 text-base font-bold text-white">{s.heading}</h3>
                    <p className="text-sm leading-relaxed text-white/75">{s.body}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Step flow overview strip */}
            <div className="mt-5 flex items-center overflow-x-auto gap-0">
              {steps.map((s, i) => (
                <div key={i} className="flex shrink-0 items-center">
                  <button
                    onClick={() => { setPaused(true); setStep(i); }}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm transition-all duration-300",
                      i <= step
                        ? "border-orange-500 bg-orange-500/20 text-lg shadow-[0_0_12px_rgba(242,121,29,0.5)]"
                        : "border-white/20 bg-white/5 text-base opacity-50",
                    )}
                  >
                    {i < step ? "✓" : s.emoji}
                  </button>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 w-6 shrink-0 transition-all duration-700",
                        i < step ? "bg-orange-500" : "bg-white/15",
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Prev / Next */}
            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={prev}
                disabled={step === 0}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                onClick={() => { setStep(0); setPaused(false); }}
                className="text-[10px] text-white/30 hover:text-white/60"
              >
                ↻ replay
              </button>
              <button
                onClick={next}
                disabled={step === steps.length - 1}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
          <p className="text-xs text-white/40">
            RGE scores are portable, transparent, and owned by the tenant — not a bureau.
          </p>
          <a
            href="/login"
            onClick={onClose}
            className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600"
          >
            Join the Grid →
          </a>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 0 0   rgba(242,121,29,0.4); }
          50%      { box-shadow: 0 0 0 12px rgba(242,121,29,0); }
        }
      `}</style>
    </div>
  );
}
