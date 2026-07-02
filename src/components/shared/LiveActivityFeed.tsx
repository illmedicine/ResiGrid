"use client";

import { useEffect, useRef, useState } from "react";

const SEED_CITIES = [
  { city: "Austin", state: "TX" },
  { city: "Chicago", state: "IL" },
  { city: "Atlanta", state: "GA" },
  { city: "Houston", state: "TX" },
  { city: "Phoenix", state: "AZ" },
  { city: "Charlotte", state: "NC" },
  { city: "Miami", state: "FL" },
  { city: "Denver", state: "CO" },
  { city: "Seattle", state: "WA" },
  { city: "Nashville", state: "TN" },
  { city: "Dallas", state: "TX" },
  { city: "Las Vegas", state: "NV" },
  { city: "Portland", state: "OR" },
  { city: "San Antonio", state: "TX" },
  { city: "Baltimore", state: "MD" },
  { city: "Columbus", state: "OH" },
  { city: "Indianapolis", state: "IN" },
  { city: "Memphis", state: "TN" },
  { city: "Oklahoma City", state: "OK" },
  { city: "Louisville", state: "KY" },
];

const FIRST_NAMES = [
  "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Cameron", "Quinn",
  "Devon", "Sage", "Alex", "Reese", "Drew", "Jamie", "Skyler", "Peyton",
];

type ActivityType = "dual_thumbs" | "new_listing" | "new_tenant" | "lease_signed" | "new_pm";

interface Activity {
  id: number;
  type: ActivityType;
  text: string;
  subtext: string;
  icon: string;
  accentClass: string;
}

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateActivity(id: number): Activity {
  const loc = randItem(SEED_CITIES);
  const name1 = randItem(FIRST_NAMES);
  const name2 = randItem(FIRST_NAMES.filter((n) => n !== name1));
  const type: ActivityType = randItem([
    "dual_thumbs", "dual_thumbs", "dual_thumbs",   // weight dual thumbs higher
    "new_listing", "new_tenant", "lease_signed", "new_pm",
  ]);

  switch (type) {
    case "dual_thumbs":
      return {
        id, type,
        text: "Rent confirmed",
        subtext: `${name1} & ${name2} · ${loc.city}, ${loc.state}`,
        icon: "👍👍",
        accentClass: "border-green-200 bg-green-50",
      };
    case "new_listing":
      return {
        id, type,
        text: "New unit listed",
        subtext: `${loc.city}, ${loc.state}`,
        icon: "🏠",
        accentClass: "border-blue-200 bg-blue-50",
      };
    case "new_tenant":
      return {
        id, type,
        text: `${name1} joined ResiGrid`,
        subtext: `New verified resident · ${loc.city}, ${loc.state}`,
        icon: "✨",
        accentClass: "border-orange-200 bg-orange-50",
      };
    case "lease_signed":
      return {
        id, type,
        text: "Lease executed",
        subtext: `${name1} signed in ${loc.city}, ${loc.state}`,
        icon: "📄",
        accentClass: "border-purple-200 bg-purple-50",
      };
    case "new_pm":
      return {
        id, type,
        text: "New property manager",
        subtext: `${name2} activated in ${loc.city}, ${loc.state}`,
        icon: "🔑",
        accentClass: "border-navy-900/20 bg-navy-900/5",
      };
  }
}

interface Toast extends Activity {
  exiting: boolean;
}

export function LiveActivityFeed() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    function addToast() {
      const id = ++counterRef.current;
      const activity = generateActivity(id);
      setToasts((prev) => [...prev.slice(-2), { ...activity, exiting: false }]);

      // Auto-dismiss after 6s
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 400);
      }, 6000);
    }

    // Initial delay before first toast (30–60s after page load)
    const initialDelay = 30000 + Math.random() * 30000;
    const t0 = setTimeout(() => {
      addToast();
      // Then every 45–90 seconds
      function scheduleNext() {
        const delay = 45000 + Math.random() * 45000;
        return setTimeout(() => { addToast(); timers.push(scheduleNext()); }, delay);
      }
      const timers: ReturnType<typeof setTimeout>[] = [scheduleNext()];
      return () => timers.forEach(clearTimeout);
    }, initialDelay);

    return () => clearTimeout(t0);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-4 z-[9000] flex flex-col gap-2 max-w-[280px] pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 shadow-lg backdrop-blur-sm transition-all duration-400 ${toast.accentClass} ${
            toast.exiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          }`}
          style={{ animation: toast.exiting ? undefined : "slide-in-left 0.35s ease-out" }}
        >
          <span className="text-xl shrink-0 leading-none">{toast.icon}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-navy-900 leading-tight">{toast.text}</p>
            <p className="text-[10px] text-neutral-600 leading-tight mt-0.5 truncate">{toast.subtext}</p>
          </div>
          <span className="ml-auto shrink-0">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          </span>
        </div>
      ))}
      <style>{`
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
