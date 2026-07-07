"use client";

// Flip-clock style counter showing how many Grid Early Adopter free-year
// slots remain. Reads promotions/gridEarlyAdopter live (publicly readable —
// this renders on the pre-auth landing page). Defaults to the full 50 until
// the first claim creates the doc.

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const TOTAL_SLOTS = 50;

export function EarlyAdopterCounter() {
  const [remaining, setRemaining] = useState<number>(TOTAL_SLOTS);
  const [flipping, setFlipping] = useState<Set<number>>(new Set());
  const prevDigits = useRef<string[] | null>(null);

  useEffect(() => {
    return onSnapshot(
      doc(db, "promotions", "gridEarlyAdopter"),
      (snap) => {
        const total: number = snap.exists() ? (snap.data().totalSlots ?? TOTAL_SLOTS) : TOTAL_SLOTS;
        const claimed: number = snap.exists() ? (snap.data().claimedCount ?? 0) : 0;
        const next = Math.max(0, total - claimed);
        setRemaining(next);

        const digits = String(next).padStart(2, "0").split("");
        if (prevDigits.current) {
          const changed = new Set<number>();
          digits.forEach((d, i) => {
            if (prevDigits.current![i] !== d) changed.add(i);
          });
          if (changed.size > 0) {
            setFlipping(changed);
            setTimeout(() => setFlipping(new Set()), 700);
          }
        }
        prevDigits.current = digits;
      },
      () => {},
    );
  }, []);

  const digits = String(remaining).padStart(2, "0").split("");
  const soldOut = remaining <= 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <style>{`
        @keyframes ea-flip {
          0%   { transform: rotateX(0deg); }
          50%  { transform: rotateX(-90deg); }
          100% { transform: rotateX(0deg); }
        }
      `}</style>
      <div className="flex items-center gap-1.5" style={{ perspective: "300px" }}>
        {digits.map((d, i) => (
          <span
            key={i}
            className="relative flex h-14 w-11 items-center justify-center overflow-hidden rounded-lg font-mono text-3xl font-black text-orange-400 md:h-16 md:w-12 md:text-4xl"
            style={{
              background: "linear-gradient(180deg, #16213a 0%, #0e1728 49%, #0a1220 51%, #101b30 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.6), 0 3px 8px rgba(0,0,0,0.45)",
              animation: flipping.has(i) ? "ea-flip 0.6s ease-in-out" : undefined,
              transformStyle: "preserve-3d",
            }}
          >
            {/* flip-clock split line */}
            <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/60" />
            <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px translate-y-px bg-white/5" />
            {d}
          </span>
        ))}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300">
        {soldOut ? "Free-year spots — all claimed" : "Free first-year spots remaining"}
      </p>
    </div>
  );
}
