"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { Button } from "@/components/ui/Button";
import type { PMTeamInviteDoc } from "@/lib/types/models";

type AcceptState = "loading" | "accepting" | "success" | "error";

function AcceptContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, userDoc, loading: authLoading } = useAuth();
  const inviteId = params.get("invite");

  const [invite, setInvite] = useState<PMTeamInviteDoc | null>(null);
  const [state, setState] = useState<AcceptState>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!inviteId) {
      setState("error");
      setErrorMsg("Invalid invite link — no invite ID found.");
      return;
    }

    getDoc(doc(db, "pmTeamInvites", inviteId))
      .then((snap) => {
        if (!snap.exists()) {
          setState("error");
          setErrorMsg("This invite link is no longer valid.");
          return;
        }
        const data = snap.data() as PMTeamInviteDoc;
        if (data.status === "accepted") {
          setState("success");
        } else if (data.status === "revoked") {
          setState("error");
          setErrorMsg("This invite has been revoked by the property manager.");
        } else {
          setInvite(data);
          setState("loading"); // wait for auth
        }
      })
      .catch(() => {
        setState("error");
        setErrorMsg("Failed to load invite. Please try again.");
      });
  }, [inviteId]);

  useEffect(() => {
    if (authLoading || !invite || state !== "loading") return;

    if (!user) {
      // Redirect to login; return here after
      router.replace(`/login?role=property_manager&returnTo=${encodeURIComponent(`/pm/team/accept?invite=${inviteId}`)}`);
      return;
    }

    // Validate email match
    const userEmail = (user.email ?? "").toLowerCase();
    if (userEmail !== invite.email) {
      setState("error");
      setErrorMsg(
        `This invite was sent to ${invite.email}, but you are signed in as ${user.email}. ` +
        "Please sign out and sign in with the correct Google account.",
      );
      return;
    }

    if (invite.status === "accepted") {
      setState("success");
      return;
    }

    // Accept the invite
    setState("accepting");
    const acceptInvite = async () => {
      try {
        await Promise.all([
          updateDoc(doc(db, "pmTeamInvites", invite.id), {
            status: "accepted",
            memberId: user.uid,
            acceptedAt: Date.now(),
          }),
          updateDoc(doc(db, "users", user.uid), {
            role: "property_manager",
            teamAdminId: invite.adminId,
            teamPropertyIds: invite.propertyIds,
          }),
        ]);
        setState("success");
      } catch (err) {
        setState("error");
        setErrorMsg(err instanceof Error ? err.message : "Failed to accept invite.");
      }
    };

    acceptInvite();
  }, [authLoading, user, invite, state, inviteId, router]);

  if (state === "loading" || state === "accepting" || authLoading) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <p className="text-sm text-neutral-600">
          {state === "accepting" ? "Activating your access…" : "Loading invite…"}
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
            {invite
              ? `You now have access to ${invite.propertyIds.length} propert${invite.propertyIds.length === 1 ? "y" : "ies"} managed by ${invite.adminName}.`
              : "Your team access has been activated."}
          </p>
        </div>
        <Button onClick={() => router.replace("/pm/dashboard")}>
          Go to portal
        </Button>
      </div>
    );
  }

  // error state
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <XCircle className="h-12 w-12 text-red-500" />
      <div>
        <h1 className="text-xl font-bold text-navy-900">Invite not valid</h1>
        <p className="mt-1 text-sm text-neutral-600">{errorMsg}</p>
      </div>
      <Button variant="outline" onClick={() => router.replace("/")}>
        Go to home
      </Button>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-lg">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          }
        >
          <AcceptContent />
        </Suspense>
      </div>
    </div>
  );
}
