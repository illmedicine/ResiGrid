"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { Camera, CheckCircle2, Landmark, Receipt, Save, User } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { useSquareConnected } from "@/lib/hooks/useSquareConnected";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { PropertyManagerDoc } from "@/lib/types/models";

export default function PmSettingsPage() {
  const { user, userDoc } = useAuth();
  const { connected, connectedAt } = useSquareConnected(Boolean(user));

  const [displayName, setDisplayName] = useState(userDoc?.displayName ?? "");
  const [businessName, setBusinessName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const photoURL = user?.photoURL ?? userDoc?.photoURL;

  // Load the existing business name from the propertyManagers profile.
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "propertyManagers", user.uid)).then((snap) => {
      const profile = snap.data() as PropertyManagerDoc | undefined;
      if (profile?.businessName) setBusinessName(profile.businessName);
    });
  }, [user]);

  async function handleSave() {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
      });
      await setDoc(
        doc(db, "propertyManagers", user.uid),
        { uid: user.uid, businessName: businessName.trim() },
        { merge: true },
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Settings</h1>
        <p className="text-sm text-neutral-600">Manage your profile and preferences.</p>
      </div>

      {/* Profile section */}
      <Card className="p-5">
        <CardContent className="flex flex-col gap-4 p-0">
          <h2 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
            <User className="h-4 w-4 text-orange-500" />
            Profile
          </h2>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoURL}
                  alt="Profile"
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-orange-200"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-navy-900 flex items-center justify-center ring-2 ring-orange-200">
                  <span className="text-xl font-bold text-white">
                    {(displayName || "?")[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow">
                <Camera className="h-3.5 w-3.5 text-neutral-500" />
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-900">{displayName || "—"}</p>
              <p className="text-xs text-neutral-500">{user?.email}</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Profile photo syncs from your Google account.
              </p>
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-xs font-medium text-navy-900 mb-1">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-navy-900 focus:border-orange-400 focus:outline-none"
              placeholder="Your name"
            />
          </div>

          {/* Business name */}
          <div>
            <label className="block text-xs font-medium text-navy-900 mb-1">
              Business name <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-navy-900 focus:border-orange-400 focus:outline-none"
              placeholder="e.g. Griffin House Realty LLC"
            />
            <p className="mt-1 flex items-start gap-1 text-[11px] text-neutral-500">
              <Receipt className="mt-0.5 h-3 w-3 shrink-0 text-orange-500" />
              Shown on every rent receipt and invoice your tenants receive. If empty,
              your display name is used instead.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !displayName.trim()}
            size="sm"
            className="w-fit"
          >
            <Save className="h-4 w-4" />
            {saved ? "Saved!" : saving ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Payments / payout connection */}
      <Card className={`p-5 ${connected ? "border-green-200" : "border-orange-200"}`}>
        <CardContent className="flex flex-col gap-3 p-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Landmark className="h-4 w-4 text-orange-500" />
            Receiving Payments
          </h2>
          {connected === null ? (
            <p className="text-xs text-neutral-500">Checking connection…</p>
          ) : connected ? (
            <div className="flex items-start gap-2 rounded-xl bg-green-50 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-700">
                  Connected — you&apos;re receiving tenant payments
                </p>
                <p className="text-xs text-green-600">
                  Rent lands directly in the bank account linked to your Square account
                  {connectedAt
                    ? ` (connected ${new Date(connectedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })})`
                    : ""}
                  . Square pays out on its normal schedule.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-neutral-600">
                Connect your Square account to start receiving rent from your tenants —
                it links straight to your bank and takes about two minutes. Until then,
                tenant payments arrive as claim links instead of automatic deposits.
              </p>
              <Button href="/pm/payouts" size="sm" className="w-fit">
                <Landmark className="h-4 w-4" />
                Connect payouts
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Account info */}
      <Card className="p-5">
        <CardContent className="flex flex-col gap-3 p-0">
          <h2 className="text-sm font-semibold text-navy-900">Account</h2>
          <div className="flex flex-col gap-1.5 text-xs text-neutral-600">
            <p><span className="font-medium text-navy-900">Email:</span> {user?.email}</p>
            <p><span className="font-medium text-navy-900">Role:</span> Property Manager</p>
            <p><span className="font-medium text-navy-900">User ID:</span> <span className="font-mono">{user?.uid}</span></p>
            <p>
              <span className="font-medium text-navy-900">Sign-in method:</span>{" "}
              {user?.providerData[0]?.providerId === "google.com" ? "Google" : "Email/password"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card className="p-5">
        <CardContent className="flex flex-col gap-3 p-0">
          <h2 className="text-sm font-semibold text-navy-900">Notifications</h2>
          <p className="text-xs text-neutral-500">
            Email notifications are sent to <span className="font-medium text-navy-900">{user?.email}</span>.
          </p>
          <PreferenceRow label="New tenant applications" defaultOn />
          <PreferenceRow label="Lease signed by tenant" defaultOn />
          <PreferenceRow label="Rent payments received" defaultOn />
          <PreferenceRow label="Maintenance requests" defaultOn />
          <PreferenceRow label="Message notifications" />
        </CardContent>
      </Card>
    </div>
  );
}

function PreferenceRow({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-navy-900">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn(!on)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          on ? "bg-orange-500" : "bg-neutral-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
