"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { signInWithGoogle } from "@/lib/firebase/auth";
import type { UserRole } from "@/lib/types/models";

const ROLE_CONFIG = {
  tenant: {
    label: "Tenant",
    icon: KeyRound,
    description: "Pay rent, search apartments, submit maintenance requests, and build your reputation.",
    portal: "/tenant/dashboard",
  },
  property_manager: {
    label: "Property Manager",
    icon: ShieldCheck,
    description: "Manage properties, tenants, leases, collect payments, and screen applicants.",
    portal: "/pm/dashboard",
  },
} as const;

export function AuthGate() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, userDoc, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // Safety valve: if user is authenticated but userDoc never arrives after
  // 12 s, show a retry option rather than spinning forever.
  useEffect(() => {
    if (!user || userDoc) {
      setTimedOut(false);
      return;
    }
    const t = setTimeout(() => setTimedOut(true), 12_000);
    return () => clearTimeout(t);
  }, [user, userDoc]);

  const role = (params.get("role") as UserRole) ??
    (params.get("path") === "pm" ? "property_manager" : "tenant");
  const config = ROLE_CONFIG[role];

  // Redirect authenticated users to their portal immediately.
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!userDoc) return; // wait until user doc is written and snapshot arrives

    const pendingClaim = sessionStorage.getItem("resigrid_pending_claim");
    if (pendingClaim && userDoc.role === "property_manager") {
      sessionStorage.removeItem("resigrid_pending_claim");
      router.replace(`/claim/?token=${pendingClaim}`);
      return;
    }
    router.replace(ROLE_CONFIG[userDoc.role]?.portal ?? "/tenant/dashboard");
  }, [loading, user, userDoc, router]);

  // Timed out waiting for user doc — show a clear error + retry.
  if (timedOut && user && !userDoc) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <p className="text-sm font-medium text-red-600">
          Couldn&apos;t finish setting up your account.
        </p>
        <p className="text-xs text-neutral-500">
          This usually means Firestore rules haven&apos;t been deployed yet.
          Check Firebase Console → Firestore → Rules, then try again.
        </p>
        <button
          onClick={() => { setTimedOut(false); signInWithGoogle(role); }}
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Try again
        </button>
      </div>
    );
  }

  // While loading auth state or waiting for user doc to propagate after
  // a fresh Google sign-in, show a neutral loading screen.
  if (loading || (user && !userDoc)) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
        <p className="text-sm text-neutral-600">
          {user ? "Setting up your account…" : "Loading…"}
        </p>
      </div>
    );
  }

  // Already authenticated with userDoc loaded — the useEffect above is
  // about to redirect, so just show the spinner.
  if (user && userDoc) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
        <p className="text-sm text-neutral-600">Redirecting…</p>
      </div>
    );
  }

  async function handleGoogleSignIn() {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle(role);
      // Popup closed — onAuthStateChanged fires, AuthProvider's onSnapshot
      // creates the user doc, and the useEffect above will redirect to portal.
      // Keep signingIn=true (shows spinner) until the redirect fires.
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      // Ignore "popup closed by user" — they just cancelled
      if (!msg.includes("popup-closed") && !msg.includes("cancelled")) {
        setError(msg);
      }
      setSigningIn(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span className="rounded-full bg-orange-100 p-4 text-orange-600">
        <config.icon className="h-8 w-8" />
      </span>

      <div>
        <h1 className="text-2xl font-bold text-navy-900">
          {config.label} Portal
        </h1>
        <p className="mt-2 max-w-xs text-sm text-neutral-600">
          {config.description}
        </p>
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={signingIn}
        className="flex w-full max-w-xs items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white px-6 py-3.5 text-sm font-semibold text-navy-900 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60"
      >
        {signingIn ? (
          <Loader2 className="h-5 w-5 animate-spin text-neutral-600" />
        ) : (
          <GoogleIcon />
        )}
        {signingIn ? "Redirecting to Google…" : "Continue with Google"}
      </button>

      <p className="text-xs text-neutral-500">
        New or returning — one button does it all.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
