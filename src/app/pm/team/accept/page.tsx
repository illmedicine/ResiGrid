"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { functions } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { Button } from "@/components/ui/Button";

type AcceptState = "loading" | "accepting" | "success" | "error";

interface AcceptResult { adminId: string; propertyIds: string[]; }

function AcceptContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const inviteId = params.get("invite");

  const [state, setState] = useState<AcceptState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [propertyCount, setPropertyCount] = useState(0);

  useEffect(() => {
    if (!inviteId) {
      setState("error");
      setErrorMsg("Invalid invite link.");
      return;
    }
    if (authLoading) return;

    if (!user) {
      router.replace(
        `/login?role=property_manager&returnTo=${encodeURIComponent(`/pm/team/accept?invite=${inviteId}`)}`,
      );
      return;
    }

    if (state !== "loading") return;
    setState("accepting");

    const accept = httpsCallable<{ inviteId: string }, AcceptResult>(
      functions,
      "acceptTeamInvite",
    );

    accept({ inviteId })
      .then((result) => {
        setPropertyCount(result.data.propertyIds.length);
        setState("success");
      })
      .catch((err: Error) => {
        setState("error");
        setErrorMsg(err.message ?? "Failed to accept invite.");
      });
  }, [inviteId, authLoading, user, state, router]);

  if (state === "loading" || state === "accepting" || authLoading) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <p className="text-sm text-neutral-600">
          {state === "accepting" ? "Activating your access…" : "Loading…"}
        </p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <div>
          <h1 className="text-xl font-bold text-navy-900">You&apos;re in!</h1>
          <p className="mt-1 text-sm text-neutral-600">
            You now have access to{" "}
            <strong>{propertyCount} propert{propertyCount === 1 ? "y" : "ies"}</strong>.
          </p>
        </div>
        <Button onClick={() => router.replace("/pm/dashboard")}>Go to portal</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <XCircle className="h-12 w-12 text-red-500" />
      <div>
        <h1 className="text-xl font-bold text-navy-900">Invite not valid</h1>
        <p className="mt-1 text-sm text-neutral-600">{errorMsg}</p>
      </div>
      <Button variant="outline" onClick={() => router.replace("/")}>Go to home</Button>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-lg">
        <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>}>
          <AcceptContent />
        </Suspense>
      </div>
    </div>
  );
}
