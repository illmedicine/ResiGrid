"use client";

import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { CheckCircle2, Landmark } from "lucide-react";
import { functions } from "@/lib/firebase/config";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ConnectionStatus {
  connected: boolean;
  connectedAt?: number;
}

export default function PmPayoutsPage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getStatus = httpsCallable<unknown, ConnectionStatus>(
      functions,
      "getSquareConnectionStatus",
    );
    getStatus()
      .then((res) => setStatus(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load status"))
      .finally(() => setLoading(false));
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const getConnectUrl = httpsCallable<{ claimToken?: string }, { url: string }>(
        functions,
        "getSquareConnectUrl",
      );
      const res = await getConnectUrl({});
      window.location.href = res.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start Square connection");
      setConnecting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Payouts</h1>
        <p className="text-sm text-neutral-600">
          Connect a Square account so rent payments collected through
          ResiGrid land directly in your bank account.
        </p>
      </div>

      <Card className="p-5">
        <CardContent className="flex flex-col gap-3 p-0">
          {loading ? (
            <p className="text-sm text-neutral-600">Checking connection…</p>
          ) : status?.connected ? (
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Square account connected
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Landmark className="h-5 w-5 text-navy-900" />
                No Square account connected yet.
              </div>
              <Button onClick={handleConnect} disabled={connecting} className="w-fit">
                {connecting ? "Redirecting…" : "Connect Square"}
              </Button>
            </>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
