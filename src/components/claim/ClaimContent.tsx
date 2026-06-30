"use client";

import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface VoucherPreview {
  amount: number;
  senderName: string;
  status: string;
}

interface ConnectionStatus {
  connected: boolean;
}

export function ClaimContent({ token }: { token: string }) {
  const { user, userDoc, loading: authLoading } = useAuth();
  const [preview, setPreview] = useState<VoucherPreview | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const getPreview = httpsCallable<{ claimToken: string }, VoucherPreview>(
      functions,
      "getVoucherPreview",
    );
    getPreview({ claimToken: token })
      .then((res) => setPreview(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Invalid claim link"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!user || userDoc?.role !== "property_manager") return;
    const getStatus = httpsCallable<unknown, ConnectionStatus>(
      functions,
      "getSquareConnectionStatus",
    );
    getStatus().then((res) => setConnection(res.data));
  }, [user, userDoc]);

  async function handleConnectAndClaim() {
    setActing(true);
    setError(null);
    try {
      const getConnectUrl = httpsCallable<{ claimToken?: string }, { url: string }>(
        functions,
        "getSquareConnectUrl",
      );
      const res = await getConnectUrl({ claimToken: token });
      window.location.href = res.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start Square connection");
      setActing(false);
    }
  }

  async function handleClaimNow() {
    setActing(true);
    setError(null);
    try {
      const claim = httpsCallable<{ claimToken: string }, { voucherId: string }>(
        functions,
        "claimVoucher",
      );
      await claim({ claimToken: token });
      setClaimed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim payment");
    } finally {
      setActing(false);
    }
  }

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>;
  if (error && !preview) return <p className="text-sm text-red-600">{error}</p>;
  if (!preview) return null;

  return (
    <Card className="p-6">
      <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
        <p className="text-sm text-neutral-600">{preview.senderName} sent you</p>
        <p className="text-3xl font-bold text-navy-900">
          ${preview.amount.toLocaleString()}
        </p>

        {claimed || preview.status === "paid_out" ? (
          <p className="text-sm font-medium text-green-700">
            Payment claimed — funds are on their way to your bank.
          </p>
        ) : preview.status !== "pending" ? (
          <p className="text-sm text-neutral-600">
            This payment is {preview.status} and can no longer be claimed here.
          </p>
        ) : !user ? (
          <>
            <p className="text-sm text-neutral-600">
              Sign up or log in as a property manager to claim this payment.
            </p>
            <div className="flex gap-2">
              <Button
                href="/signup?role=property_manager"
                size="sm"
                onClick={() => sessionStorage.setItem("resigrid_pending_claim", token)}
              >
                Sign up
              </Button>
              <Button
                href="/login"
                variant="outline"
                size="sm"
                onClick={() => sessionStorage.setItem("resigrid_pending_claim", token)}
              >
                Log in
              </Button>
            </div>
          </>
        ) : userDoc?.role !== "property_manager" ? (
          <p className="text-sm text-neutral-600">
            This payment can only be claimed by a property manager account.
          </p>
        ) : connection?.connected ? (
          <Button onClick={handleClaimNow} disabled={acting}>
            {acting ? "Claiming…" : "Claim now"}
          </Button>
        ) : (
          <Button onClick={handleConnectAndClaim} disabled={acting}>
            {acting ? "Redirecting…" : "Connect Square to claim"}
          </Button>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {!authLoading && user && userDoc?.role === "property_manager" && !connection && (
          <p className="text-xs text-neutral-600">Checking Square connection…</p>
        )}
      </CardContent>
    </Card>
  );
}
