"use client";

import { useEffect, useRef, useState } from "react";
import { doc, getDoc, onSnapshot, runTransaction, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";

const STATS_REF = () => doc(db, "platformStats", "global");
const LOGIN_REF = (uid: string) => doc(db, "uniqueLogins", uid);

export function FlipCounter() {
  const { user } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const [flippingDigits, setFlippingDigits] = useState<Set<number>>(new Set());
  const prevDigits = useRef<string[]>([]);
  const tracked = useRef(false);

  // Live count subscription — publicly readable
  useEffect(() => {
    return onSnapshot(STATS_REF(), (snap) => {
      const c: number = snap.exists() ? (snap.data().uniqueLoginCount ?? 0) : 0;
      setCount(c);

      const next = String(c).padStart(6, "0").split("");
      const flipping = new Set<number>();
      next.forEach((d, i) => {
        if (prevDigits.current[i] !== undefined && prevDigits.current[i] !== d) {
          flipping.add(i);
        }
      });
      if (flipping.size > 0) {
        setFlippingDigits(flipping);
        setTimeout(() => setFlippingDigits(new Set()), 500);
      }
      prevDigits.current = next;
    });
  }, []);

  // Track new unique login — runs once per user, per session
  useEffect(() => {
    if (!user || tracked.current) return;
    tracked.current = true;

    const loginRef = LOGIN_REF(user.uid);
    const statsRef = STATS_REF();

    getDoc(loginRef).then((snap) => {
      if (snap.exists()) return; // already counted

      runTransaction(db, async (tx) => {
        const [lSnap, sSnap] = await Promise.all([tx.get(loginRef), tx.get(statsRef)]);
        if (lSnap.exists()) return; // idempotency guard

        tx.set(loginRef, { uid: user.uid, firstLoginAt: Date.now() });

        if (sSnap.exists()) {
          tx.update(statsRef, {
            uniqueLoginCount: (sSnap.data().uniqueLoginCount ?? 0) + 1,
          });
        } else {
          tx.set(statsRef, { uniqueLoginCount: 1 });
        }
      });
    });
  }, [user]);

  if (count === null) return null;

  const digits = String(count).padStart(6, "0").split("");
  const isFlipping = flippingDigits.size > 0;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 select-none transition-opacity duration-700"
      style={{ opacity: isFlipping ? 0.92 : 0.22 }}
      title=""
    >
      <div className="flex gap-px">
        {/* Separator dot between groups of 3 */}
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
                background: "linear-gradient(180deg, #c95f0f 0%, #ea580c 49%, #b34a0a 50%, #c95f0f 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.5)",
              }}
            >
              {/* Horizontal split line — classic flip clock detail */}
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
