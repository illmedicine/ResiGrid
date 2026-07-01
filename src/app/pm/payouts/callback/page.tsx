"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { CheckCircle2, XCircle } from "lucide-react";
import { functions } from "@/lib/firebase/config";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CompleteOAuthResponse {
  connected: boolean;
  claimedVoucherId?: string;
  newInvitePM?: boolean;
}

function CallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<"working" | "success" | "error">("working");
  const [claimedVoucherId, setClaimedVoucherId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const oauthState = params.get("state");
    if (!code || !oauthState) {
      setState("error");
      setError("Missing OAuth parameters from Square.");
      return;
    }

    const completeOAuth = httpsCallable<
      { code: string; state: string },
      CompleteOAuthResponse
    >(functions, "completeSquareOAuth");

    completeOAuth({ code, state: oauthState })
      .then((res) => {
        setClaimedVoucherId(res.data.claimedVoucherId);
        setState("success");
        if (res.data.newInvitePM) {
          router.replace("/pm/onboarding?from=claim");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to connect Square");
        setState("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <Card className="mx-auto mt-10 max-w-md p-6">
      <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
        {state === "working" && (
          <p className="text-sm text-neutral-600">Connecting your Square account…</p>
        )}
        {state === "success" && (
          <>
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <p className="text-sm font-medium text-navy-900">Square account connected</p>
            {claimedVoucherId && (
              <p className="text-sm text-neutral-600">
                Your payment has been claimed and deposited.
              </p>
            )}
            <Button href="/pm/dashboard" size="sm">
              Go to dashboard
            </Button>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="h-10 w-10 text-red-600" />
            <p className="text-sm font-medium text-navy-900">Connection failed</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button href="/pm/payouts" size="sm" variant="outline">
              Try again
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function PmPayoutsCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
