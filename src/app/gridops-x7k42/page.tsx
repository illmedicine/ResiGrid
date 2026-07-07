"use client";

// ResiGrid Admin Portal — unlisted URL, but the real access control lives
// server-side in adminGetOverview/adminSetUserRole (Google-account allowlist
// + PIN, both verified in the Cloud Function). Nothing rendered here is
// readable without passing those checks.

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import {
  Activity,
  Building2,
  DollarSign,
  FileText,
  Home,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { functions } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { signInWithGoogle, signOut } from "@/lib/firebase/auth";

interface AdminUserSummary {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: string;
  createdAt: number;
  propertyCount?: number;
  unitCount?: number;
  activeLeaseCount?: number;
  rgeScore?: number;
  subscriptionActive?: boolean;
  subscriptionTier?: string;
  totalPaidToPlatform?: number;
  promo?: string;
  promoRevokedAt?: number;
}

interface AdminRecentPayment {
  id: string;
  amount: number;
  status: string;
  onTime?: boolean;
  paidDate?: number;
  tenantName: string;
  pmName: string;
}

interface Overview {
  metrics: {
    tenantCount: number;
    pmCount: number;
    propertyCount: number;
    unitCount: number;
    occupiedUnitCount: number;
    publishedListingCount: number;
    activeLeaseCount: number;
    pendingLeaseCount: number;
    completedPaymentCount: number;
    rentVolume: number;
    platformRevenue: number;
    activeSubscriptionCount: number;
    pendingVoucherCount: number;
    openMaintenanceCount: number;
    promoTotalSlots: number;
    promoClaimedCount: number;
  };
  tenants: AdminUserSummary[];
  propertyManagers: AdminUserSummary[];
  recentPayments: AdminRecentPayment[];
}

function fmtDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminPortalPage() {
  const { user, loading: authLoading } = useAuth();
  const [pin, setPin] = useState("");
  const [activePin, setActivePin] = useState<string | null>(null);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleBusy, setRoleBusy] = useState<string | null>(null);

  async function loadOverview(usePin: string) {
    setLoading(true);
    setError(null);
    try {
      const call = httpsCallable<{ pin: string }, Overview>(functions, "adminGetOverview");
      const res = await call({ pin: usePin });
      setData(res.data);
      setActivePin(usePin);
    } catch (err) {
      setData(null);
      setActivePin(null);
      setError(err instanceof Error ? err.message : "Access denied.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePromoChange(target: AdminUserSummary) {
    if (!activePin) return;
    const revoking = !target.promoRevokedAt;
    const msg = revoking
      ? `REVOKE Early Adopter access for ${target.displayName || target.email}?\n\nThey keep access for 30 days, then their PM portal access ends and ALL their property data is permanently deleted.`
      : `Restore Early Adopter access for ${target.displayName || target.email}? This cancels the pending 30-day data deletion.`;
    if (!window.confirm(msg)) return;
    setRoleBusy(target.uid);
    setError(null);
    try {
      const call = httpsCallable<{ pin: string; uid: string; action: string }, { ok: boolean }>(
        functions,
        "adminSetPromoAccess",
      );
      await call({ pin: activePin, uid: target.uid, action: revoking ? "revoke" : "restore" });
      await loadOverview(activePin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Promo change failed.");
    } finally {
      setRoleBusy(null);
    }
  }

  async function handleRoleChange(target: AdminUserSummary) {
    if (!activePin) return;
    const newRole = target.role === "tenant" ? "property_manager" : "tenant";
    const label = newRole === "tenant" ? "Tenant" : "Property Manager";
    if (!window.confirm(`Change ${target.displayName || target.email} to ${label}?`)) return;
    setRoleBusy(target.uid);
    setError(null);
    try {
      const call = httpsCallable<{ pin: string; uid: string; role: string }, { ok: boolean }>(
        functions,
        "adminSetUserRole",
      );
      await call({ pin: activePin, uid: target.uid, role: newRole });
      await loadOverview(activePin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Role change failed.");
    } finally {
      setRoleBusy(null);
    }
  }

  // ── Gate 1: Google sign-in ──────────────────────────────────────────
  if (authLoading) {
    return (
      <Shell>
        <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
      </Shell>
    );
  }
  if (!user) {
    return (
      <Shell>
        <ShieldCheck className="h-10 w-10 text-orange-400" />
        <h1 className="text-lg font-bold text-white">ResiGrid Command Center</h1>
        <p className="max-w-xs text-center text-sm text-white/50">
          Restricted area. Sign in with an authorized Google account to continue.
        </p>
        <button
          onClick={() => signInWithGoogle("property_manager")}
          className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Continue with Google
        </button>
      </Shell>
    );
  }

  // ── Gate 2: PIN ─────────────────────────────────────────────────────
  if (!data) {
    return (
      <Shell>
        <KeyRound className="h-10 w-10 text-orange-400" />
        <h1 className="text-lg font-bold text-white">Enter Portal PIN</h1>
        <p className="text-xs text-white/40">{user.email}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pin) loadOverview(pin);
          }}
          className="flex flex-col items-center gap-3"
        >
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-40 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-xl tracking-[0.5em] text-white outline-none focus:border-orange-400"
            placeholder="••••"
          />
          <button
            type="submit"
            disabled={loading || !pin}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}
          </button>
        </form>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button onClick={() => signOut()} className="text-xs text-white/30 hover:text-white/60">
          Sign out
        </button>
      </Shell>
    );
  }

  // ── Dashboard ───────────────────────────────────────────────────────
  const m = data.metrics;
  return (
    <div className="min-h-screen bg-navy-950 bg-[#0b1220] px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-orange-400" />
            <div>
              <h1 className="text-xl font-bold text-white">ResiGrid Command Center</h1>
              <p className="text-xs text-white/40">Live production · {user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => activePin && loadOverview(activePin)}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </header>

        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

        {/* Metrics grid */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Metric icon={Users} label="Tenants" value={m.tenantCount} />
          <Metric icon={Building2} label="Property Managers" value={m.pmCount} />
          <Metric icon={Home} label="Properties" value={m.propertyCount} />
          <Metric icon={Home} label="Units" value={`${m.occupiedUnitCount}/${m.unitCount} occupied`} />
          <Metric icon={FileText} label="Active Leases" value={m.activeLeaseCount} sub={`${m.pendingLeaseCount} pending`} />
          <Metric icon={DollarSign} label="Rent Volume" value={`$${m.rentVolume.toLocaleString()}`} sub={`${m.completedPaymentCount} payments`} />
          <Metric icon={DollarSign} label="Platform Revenue" value={`$${m.platformRevenue.toLocaleString()}`} sub={`${m.activeSubscriptionCount} active subs`} highlight />
          <Metric icon={Activity} label="Published Listings" value={m.publishedListingCount} />
          <Metric icon={Activity} label="Pending Vouchers" value={m.pendingVoucherCount} />
          <Metric icon={Wrench} label="Open Maintenance" value={m.openMaintenanceCount} alert={m.openMaintenanceCount > 0} />
          <Metric
            icon={Users}
            label="Early Adopter Promo"
            value={`${m.promoClaimedCount}/${m.promoTotalSlots} claimed`}
            sub={`${Math.max(0, m.promoTotalSlots - m.promoClaimedCount)} free-year slots left`}
            highlight
          />
        </section>

        {/* Property managers */}
        <UserTable
          title={`Property Managers (${data.propertyManagers.length})`}
          users={data.propertyManagers}
          columns={(u) => [
            `${u.propertyCount ?? 0} propert${u.propertyCount === 1 ? "y" : "ies"} · ${u.unitCount ?? 0} units`,
            u.subscriptionActive ? `${u.subscriptionTier ?? "active"} · $${(u.totalPaidToPlatform ?? 0).toLocaleString()} paid` : "no subscription",
          ]}
          roleBusy={roleBusy}
          onRoleChange={handleRoleChange}
          onPromoChange={handlePromoChange}
        />

        {/* Tenants */}
        <UserTable
          title={`Tenants (${data.tenants.length})`}
          users={data.tenants}
          columns={(u) => [
            `${u.activeLeaseCount ?? 0} active lease${u.activeLeaseCount === 1 ? "" : "s"}`,
            u.rgeScore != null ? `RGE ${u.rgeScore}` : "no RGE score",
          ]}
          roleBusy={roleBusy}
          onRoleChange={handleRoleChange}
        />

        {/* Recent payments */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-4 text-sm font-bold text-white">Recent Payments</h2>
          {data.recentPayments.length === 0 ? (
            <p className="text-sm text-white/40">No completed payments yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-white/5">
              {data.recentPayments.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm">
                  <span className="w-20 font-semibold text-green-400">${p.amount.toLocaleString()}</span>
                  <span className="text-white/80">{p.tenantName}</span>
                  <span className="text-white/30">→</span>
                  <span className="text-white/80">{p.pmName}</span>
                  <span className="ml-auto flex items-center gap-2 text-xs text-white/40">
                    {p.onTime != null && (
                      <span className={p.onTime ? "text-green-400" : "text-red-400"}>
                        {p.onTime ? "on time" : "late"}
                      </span>
                    )}
                    {fmtDate(p.paidDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0b1220] px-4">
      {children}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
  alert,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-orange-400/40 bg-orange-500/10"
          : alert
            ? "border-red-400/40 bg-red-500/10"
            : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/40">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  );
}

function UserTable({
  title,
  users,
  columns,
  roleBusy,
  onRoleChange,
  onPromoChange,
}: {
  title: string;
  users: AdminUserSummary[];
  columns: (u: AdminUserSummary) => string[];
  roleBusy: string | null;
  onRoleChange: (u: AdminUserSummary) => void;
  onPromoChange?: (u: AdminUserSummary) => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="mb-4 text-sm font-bold text-white">{title}</h2>
      {users.length === 0 ? (
        <p className="text-sm text-white/40">None yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-white/5">
          {users.map((u) => (
            <div key={u.uid} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              {u.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.photoURL} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full object-cover ring-1 ring-white/20" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/60">
                  {(u.displayName || u.email || "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-[160px]">
                <p className="text-sm font-semibold text-white">{u.displayName || "—"}</p>
                <p className="text-xs text-white/40">{u.email}</p>
              </div>
              <div className="flex flex-col text-xs text-white/50">
                {columns(u).map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </div>
              <span className="text-xs text-white/30">Joined {fmtDate(u.createdAt)}</span>
              {u.promo === "grid_early_adopter" && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    u.promoRevokedAt
                      ? "bg-red-500/20 text-red-300"
                      : "bg-gradient-to-r from-orange-500/30 to-yellow-500/30 text-orange-300"
                  }`}
                >
                  {u.promoRevokedAt
                    ? `⚡ EARLY ADOPTER — DELETES ${fmtDate(u.promoRevokedAt + 30 * 24 * 60 * 60 * 1000)}`
                    : "⚡ GRID EARLY ADOPTER"}
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                  {u.role === "property_manager" ? "PM" : "Tenant"}
                </span>
                {onPromoChange && u.promo === "grid_early_adopter" && (
                  <button
                    onClick={() => onPromoChange(u)}
                    disabled={roleBusy === u.uid}
                    className={`rounded-lg border px-2.5 py-1 text-xs disabled:opacity-50 ${
                      u.promoRevokedAt
                        ? "border-green-400/40 text-green-300 hover:bg-green-500/10"
                        : "border-red-400/40 text-red-300 hover:bg-red-500/10"
                    }`}
                  >
                    {roleBusy === u.uid ? "…" : u.promoRevokedAt ? "Restore Promo" : "Revoke Promo"}
                  </button>
                )}
                <button
                  onClick={() => onRoleChange(u)}
                  disabled={roleBusy === u.uid}
                  className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
                >
                  {roleBusy === u.uid ? "…" : u.role === "tenant" ? "Make PM" : "Make Tenant"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
