"use client";

// Grid Early Adopter experience on the PM dashboard:
//  - Auto-claims a free-year slot for brand-new PMs (server enforces the
//    50-slot cap and rejects anyone with an existing subscription).
//  - Confetti + congratulations modal on the first 3 logins after claiming
//    (tracked on the user doc so it follows them across devices).
//  - Red countdown banner if an admin has revoked the promo (30-day grace
//    before property data is permanently deleted).

import { useEffect, useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Headset, Landmark, ShieldCheck, X, Zap } from "lucide-react";
import { db, functions } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { usePMSubscription } from "@/lib/hooks/usePMSubscription";
import { ConfettiCelebration } from "@/components/shared/ConfettiCelebration";
import { Button } from "@/components/ui/Button";

const PROMO = "grid_early_adopter";
const MAX_CELEBRATIONS = 3;
const GRACE_MS = 30 * 24 * 60 * 60 * 1000;

export function EarlyAdopterWelcome() {
  const { user, userDoc } = useAuth();
  const { sub, loading } = usePMSubscription(user?.uid);
  const [showCelebration, setShowCelebration] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const claimAttempted = useRef(false);
  const celebrationCounted = useRef(false);

  // Auto-claim for brand-new PMs with no subscription at all.
  useEffect(() => {
    if (loading || !user || sub || claimAttempted.current) return;
    claimAttempted.current = true;
    const claim = httpsCallable(functions, "claimEarlyAdopterPromo");
    claim({}).catch(() => {
      // Promo full / not eligible — silently fall through to normal flow.
    });
  }, [loading, user, sub]);

  const isEarlyAdopter = sub?.promo === PROMO && !sub.promoRevokedAt;
  const celebrations = userDoc?.promoCelebrations ?? 0;

  // Fire confetti + congrats on the first 3 logins (once per session).
  useEffect(() => {
    if (!user || !isEarlyAdopter || celebrationCounted.current) return;
    if (celebrations >= MAX_CELEBRATIONS) return;
    const sessionKey = `ea_celebrated_${user.uid}`;
    if (sessionStorage.getItem(sessionKey)) return;

    celebrationCounted.current = true;
    sessionStorage.setItem(sessionKey, "1");
    setShowCelebration(true);
    updateDoc(doc(db, "users", user.uid), { promoCelebrations: celebrations + 1 }).catch(() => {});
  }, [user, isEarlyAdopter, celebrations]);

  // ── Revoked: countdown warning ──────────────────────────────────────
  if (sub?.promo === PROMO && sub.promoRevokedAt) {
    const deleteDate = new Date(sub.promoRevokedAt + GRACE_MS);
    const daysLeft = Math.max(0, Math.ceil((deleteDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-bold text-red-700">
          Your Grid Early Adopter access has been revoked.
        </p>
        <p className="mt-1 text-xs text-red-600">
          Portal access ends in <strong>{daysLeft} day{daysLeft === 1 ? "" : "s"}</strong> (
          {deleteDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}),
          after which all of your property data will be <strong>permanently deleted</strong>. Contact
          support if you believe this is an error.
        </p>
      </div>
    );
  }

  if (!isEarlyAdopter) return null;

  return (
    <>
      {/* Persistent badge strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2.5">
        <span className="flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1 text-[11px] font-bold text-orange-400">
          <Zap className="h-3.5 w-3.5" />
          GRID EARLY ADOPTER
        </span>
        <span className="text-xs text-neutral-600">
          First year free · every feature unlocked · 24/7 priority support
        </span>
      </div>

      {/* Confetti + congratulations modal (first 3 logins) */}
      {showCelebration && !dismissed && (
        <>
          <ConfettiCelebration onDone={() => {}} />
          <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-navy-900/70 p-4">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="absolute right-3 top-3 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center gap-3 text-center">
                <span className="flex items-center gap-1.5 rounded-full bg-navy-900 px-4 py-1.5 text-xs font-bold text-orange-400">
                  <Zap className="h-4 w-4" />
                  GRID EARLY ADOPTER
                </span>
                <h2 className="text-xl font-bold text-navy-900">
                  🎉 Congratulations!
                </h2>
                <p className="text-sm text-neutral-600">
                  You&apos;re one of the <strong className="text-navy-900">first property managers on ResiGrid</strong> —
                  a founding member of the Residential Grid Economy. Your entire first year is on us.
                </p>

                <div className="flex w-full flex-col gap-2 rounded-xl bg-neutral-50 p-4 text-left">
                  <Perk icon={ShieldCheck} text="Exclusive all-access — every feature on the platform, no gating, no property limits" />
                  <Perk icon={Headset} text="24/7 priority support for issues, questions, and feature requests" />
                  <Perk icon={Zap} text="First year free — just $1/mo per occupied unit. Vacant units always free" />
                </div>

                <p className="text-xs text-neutral-500">
                  One step to start collecting rent: connect your Square account so tenant
                  payments land directly in your bank.
                </p>
                <div className="flex gap-2">
                  <Button href="/pm/payouts" size="sm">
                    <Landmark className="h-4 w-4" />
                    Connect payouts
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDismissed(true)}>
                    Explore first
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Perk({ icon: Icon, text }: { icon: typeof Zap; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
      <span className="text-xs text-neutral-700">{text}</span>
    </div>
  );
}
