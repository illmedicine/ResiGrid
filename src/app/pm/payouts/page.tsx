"use client";

import { useEffect, useState } from "react";
import { query, where, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { CheckCircle2, Clock, DollarSign, Landmark, RefreshCw } from "lucide-react";
import { functions } from "@/lib/firebase/config";
import { paymentsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { PaymentDoc } from "@/lib/types/models";

interface ConnectionStatus {
  connected: boolean;
  connectedAt?: number;
}

export default function PmPayoutsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentDoc[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  useEffect(() => {
    const getStatus = httpsCallable<unknown, ConnectionStatus>(functions, "getSquareConnectionStatus");
    getStatus()
      .then((res) => setStatus(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load status"))
      .finally(() => setLoading(false));
  }, []);

  // Load payments received by this PM
  useEffect(() => {
    if (!user) return;
    const q = query(paymentsCol(), where("pmId", "==", user.uid));
    return onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ ...d.data(), id: d.id } as PaymentDoc))
          .sort((a, b) => (b.paidDate ?? 0) - (a.paidDate ?? 0));
        setPayments(docs);
        setPaymentsLoading(false);
      },
      () => setPaymentsLoading(false),
    );
  }, [user]);

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

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Payment Center</h1>
        <p className="text-sm text-neutral-600">
          Rent payments from your ResiGrid tenants are deposited directly into your connected
          Square account. ResiGrid charges no fees — Square&apos;s standard processing rates apply.
        </p>
      </div>

      {/* Square connection */}
      <Card className="p-5">
        <CardContent className="flex flex-col gap-3 p-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Landmark className="h-4 w-4 text-orange-500" />
            Square account
          </h2>

          {loading ? (
            <p className="text-sm text-neutral-600">Checking connection…</p>
          ) : status?.connected ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Connected
                {status.connectedAt && (
                  <span className="text-xs font-normal text-neutral-500">
                    since {new Date(status.connectedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-600">
                Tenant payments go directly into your Square merchant account and are paid out on Square&apos;s normal schedule (typically 1–2 business days).
              </p>
              <Button size="sm" variant="outline" onClick={handleConnect} disabled={connecting} className="w-fit">
                <RefreshCw className="h-3.5 w-3.5" />
                {connecting ? "Redirecting…" : "Reconnect Square"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-neutral-600">
                Connect your Square account so rent payments from your tenants deposit directly
                into your bank. Your tenants pay right from their ResiGrid tenant portal — with
                $0 in transaction fees — and every on-time payment builds their RGE Score.
              </p>
              <Button onClick={handleConnect} disabled={connecting} className="w-fit">
                {connecting ? "Redirecting…" : "Connect Square"}
              </Button>
              <p className="text-xs text-neutral-500">
                You&apos;ll be redirected to Square to authorize access. Your credentials are stored securely by Square — ResiGrid never sees your banking details.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {/* Summary stats */}
      {payments.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            icon={DollarSign}
            label="Total received"
            value={`$${totalReceived.toLocaleString()}`}
          />
          <StatCard
            icon={CheckCircle2}
            label="Payments"
            value={String(payments.length)}
          />
          <StatCard
            icon={Clock}
            label="On-time rate"
            value={(() => {
              const withStatus = payments.filter((p) => p.onTime !== undefined);
              if (!withStatus.length) return "—";
              const pct = Math.round((withStatus.filter((p) => p.onTime).length / withStatus.length) * 100);
              return `${pct}%`;
            })()}
          />
        </div>
      )}

      {/* Payment history */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-navy-900">Payment history</h2>

        {paymentsLoading ? (
          <p className="text-sm text-neutral-600">Loading…</p>
        ) : payments.length === 0 ? (
          <Card className="p-5">
            <CardContent className="p-0">
              <p className="text-sm text-neutral-600">
                No payments received yet. Once a tenant pays you through ResiGrid, each transaction appears here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {payments.map((payment) => (
              <Card key={payment.id} className="p-4">
                <CardContent className="flex items-center justify-between gap-3 p-0">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">
                      ${payment.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {payment.paidDate
                        ? new Date(payment.paidDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                    <p className="text-xs text-neutral-400 font-mono">
                      {payment.tenantId.slice(0, 8)}…
                    </p>
                  </div>
                  <Badge
                    tone={
                      payment.onTime === true
                        ? "success"
                        : payment.onTime === false
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {payment.onTime === true
                      ? "On time"
                      : payment.onTime === false
                        ? "Late"
                        : "Received"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-1 p-0">
        <Icon className="h-4 w-4 text-orange-500" />
        <p className="text-lg font-bold text-navy-900">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
      </CardContent>
    </Card>
  );
}
