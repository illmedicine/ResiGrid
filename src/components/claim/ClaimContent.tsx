"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { Building2, CheckCircle2, ClipboardList, FileText, Landmark, Wrench } from "lucide-react";
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

interface ClaimVoucherResponse {
  voucherId: string;
  newInvitePM: boolean;
}

const PORTAL_FEATURES = [
  { icon: Landmark, label: "Collect payments directly to your bank" },
  { icon: Building2, label: "Manage properties & units" },
  { icon: ClipboardList, label: "Tenant applications & screening" },
  { icon: FileText, label: "Lease creation & digital signing" },
  { icon: Wrench, label: "Maintenance request inbox" },
];

export function ClaimContent({ token }: { token: string }) {
  const { user, userDoc, loading: authLoading } = useAuth();
  const router = useRouter();
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
      const claim = httpsCallable<{ claimToken: string }, ClaimVoucherResponse>(
        functions,
        "claimVoucher",
      );
      const res = await claim({ claimToken: token });
      if (res.data.newInvitePM) {
        router.push("/pm/onboarding?from=claim");
      } else {
        setClaimed(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim payment");
      setActing(false);
    }
  }

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>;
  if (error && !preview) return <p className="text-sm text-red-600">{error}</p>;
  if (!preview) return null;

  const amountDisplay = `$${preview.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const isAlreadyDone = claimed || preview.status === "paid_out";

  return (
    <div className="flex flex-col gap-5">
      {/* Payment amount card */}
      <Card className="p-6">
        <CardContent className="flex flex-col items-center gap-2 p-0 text-center">
          <p className="text-sm text-neutral-600">{preview.senderName} sent you</p>
          <p className="text-4xl font-bold text-navy-900">{amountDisplay}</p>
        </CardContent>
      </Card>

      {/* State-driven action area */}
      {isAlreadyDone ? (
        <Card className="p-6">
          <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <p className="text-sm font-medium text-navy-900">
              Payment claimed — funds are on their way to your bank.
            </p>
            <Button href="/pm/dashboard" size="sm">Go to dashboard</Button>
          </CardContent>
        </Card>
      ) : preview.status !== "pending" ? (
        <Card className="p-6">
          <CardContent className="p-0 text-center">
            <p className="text-sm text-neutral-600">
              This payment is {preview.status} and can no longer be claimed here.
            </p>
          </CardContent>
        </Card>
      ) : !user ? (
        /* Not signed in — show invite pitch + signup CTA */
        <>
          <Card className="p-5">
            <CardContent className="flex flex-col gap-4 p-0">
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  Create a free account to claim this payment
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  Since your tenant paid through ResiGrid, you&apos;re invited to join at no cost.
                  No signup fees, no monthly charges.
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {PORTAL_FEATURES.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2 text-xs text-neutral-700">
                    <Icon className="h-4 w-4 shrink-0 text-orange-500" />
                    {label}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button
                  href="/signup?role=property_manager"
                  className="flex-1"
                  onClick={() => sessionStorage.setItem("resigrid_pending_claim", token)}
                >
                  Join free & claim
                </Button>
                <Button
                  href="/login"
                  variant="outline"
                  className="flex-1"
                  onClick={() => sessionStorage.setItem("resigrid_pending_claim", token)}
                >
                  Log in
                </Button>
              </div>
            </CardContent>
          </Card>
          <p className="text-center text-xs text-neutral-500">
            No credit card required. Your payment will be held securely until you claim it.
          </p>
        </>
      ) : userDoc?.role !== "property_manager" ? (
        <Card className="p-6">
          <CardContent className="p-0 text-center">
            <p className="text-sm text-neutral-600">
              This payment can only be claimed by a property manager account.
            </p>
          </CardContent>
        </Card>
      ) : connection?.connected ? (
        <Card className="p-6">
          <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
            <p className="text-sm text-neutral-600">
              Your Square account is connected. Ready to receive {amountDisplay}.
            </p>
            <Button onClick={handleClaimNow} disabled={acting} className="w-full">
              {acting ? "Claiming…" : `Claim ${amountDisplay}`}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-6">
          <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
            <p className="text-sm text-neutral-600">
              Connect a Square account to receive {amountDisplay} directly to your bank.
            </p>
            <Button onClick={handleConnectAndClaim} disabled={acting} className="w-full">
              {acting ? "Redirecting…" : "Connect Square to claim"}
            </Button>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      {!authLoading && user && userDoc?.role === "property_manager" && !connection && (
        <p className="text-center text-xs text-neutral-500">Checking Square connection…</p>
      )}
    </div>
  );
}
