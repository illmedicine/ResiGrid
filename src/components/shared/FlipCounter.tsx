"use client";

import { useEffect, useRef, useState } from "react";
import { doc, getDoc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";

const STATS_REF  = () => doc(db, "platformStats", "global");
const LOGIN_REF  = (uid: string) => doc(db, "uniqueLogins", uid);
const HIDE_AFTER = 3800; // ms before counter fades back out

export function FlipCounter() {
  const { user } = useAuth();
  const [count, setCount]               = useState<number | null>(null);
  const [flippingDigits, setFlippingDigits] = useState<Set<number>>(new Set());
  const [visible, setVisible]           = useState(false);

  const prevDigits  = useRef<string[]>([]);
  const hideTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tracked     = useRef(false);
  const initialized = useRef(false); // true after first snapshot — suppresses initial "flash"

  // Live count subscription
  useEffect(() => {
    return onSnapshot(STATS_REF(), (snap) => {
      const c: number = snap.exists() ? (snap.data().uniqueLoginCount ?? 0) : 0;
      setCount(c);

      const next = String(c).padStart(6, "0").split("");

      if (!initialized.current) {
        // First load — record digits silently, never show
        initialized.current = true;
        prevDigits.current  = next;
        return;
      }

      // Detect which digit positions changed
      const flipping = new Set<number>();
      next.forEach((d, i) => {
        if (prevDigits.current[i] !== d) flipping.add(i);
      });
      prevDigits.current = next;

      if (flipping.size === 0) return;

      // Show the counter
      setFlippingDigits(flipping);
      setVisible(true);

      // Clear previous hide timer then schedule a new one
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
        setFlippingDigits(new Set());
      }, HIDE_AFTER);
    });
  }, []);

  // Clean up timer on unmount
  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  // Track new unique login — runs once per user per session
  useEffect(() => {
    if (!user || tracked.current) return;
    tracked.current = true;

    const loginRef = LOGIN_REF(user.uid);
    const statsRef = STATS_REF();

    getDoc(loginRef).then((snap) => {
      if (snap.exists()) return; // already counted

      runTransaction(db, async (tx) => {
        const [lSnap, sSnap] = await Promise.all([tx.get(loginRef), tx.get(statsRef)]);
        if (lSnap.exists()) return;

        tx.set(loginRef, { uid: user.uid, firstLoginAt: Date.now() });

        if (sSnap.exists()) {
          tx.update(statsRef, { uniqueLoginCount: (sSnap.data().uniqueLoginCount ?? 0) + 1 });
        } else {
          tx.set(statsRef, { uniqueLoginCount: 1 });
        }
      });
    });
  }, [user]);

  if (count === null) return null;

  const digits = String(count).padStart(6, "0").split("");

  return (
    <div
      className="fixed bottom-4 right-4 z-50 select-none pointer-events-none"
      style={{
        opacity:    visible ? 0.92 : 0,
        transition: visible
          ? "opacity 0.25s ease-in"
          : "opacity 1.2s ease-out",
      }}
      aria-hidden="true"
    >
      <div className="flex gap-px">
        {digits.map((d, i) => (
          <span key={i}>
            {i === 3 && (
              <span className="mx-0.5 self-center text-[9px] text-orange-600 opacity-60">·</span>
            )}
            <span
              className={`relative flex h-7 w-5 items-center justify-center overflow-hidden rounded-sm font-mono text-[13px] font-black text-white ${
                flippingDigits.has(i) ? "animate-flip-digit" : ""
              }`}
              style={{
                background:
                  "linear-gradient(180deg, #c95f0f 0%, #ea580c 49%, #b34a0a 50%, #c95f0f 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.5)",
              }}
            >
              <span
                className="pointer-events-none absolute inset-x-0 top-1/2 h-px"
                style={{ background: "rgba(0,0,0,0.35)" }}
              />
              {d}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
