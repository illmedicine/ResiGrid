"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { Camera, Save, User } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/hooks";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getPrestigeTier } from "@/lib/rge/prestige";

export default function TenantSettingsPage() {
  const { user, userDoc } = useAuth();

  const [displayName, setDisplayName] = useState(userDoc?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const photoURL = user?.photoURL ?? userDoc?.photoURL;
  const prestige = getPrestigeTier(0);

  async function handleSave() {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
      });
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
            <p className="text-[10px] text-neutral-400 mt-1">
              This name appears on your lease documents when you sign.
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

      {/* RGE / Prestige */}
      <Card className="p-5 border-orange-100 bg-orange-50/30">
        <CardContent className="flex flex-col gap-2 p-0">
          <h2 className="text-sm font-semibold text-navy-900">Residential Grid Economy</h2>
          <p className="text-xs text-neutral-600">
            Your RGE score grows with every on-time payment, approved application, and positive
            review. Active lease holders earn higher standing in the platform.
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${prestige.badgeClass}`}>
              {prestige.emoji} {prestige.label}
            </span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">
            Tiers: ✦ Spark → 🏠 Resident (100) → ✅ Verified (300) → ⭐ Premier (600) → 👑 Prestige Elite (1000)
          </p>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card className="p-5">
        <CardContent className="flex flex-col gap-3 p-0">
          <h2 className="text-sm font-semibold text-navy-900">Account</h2>
          <div className="flex flex-col gap-1.5 text-xs text-neutral-600">
            <p><span className="font-medium text-navy-900">Email:</span> {user?.email}</p>
            <p><span className="font-medium text-navy-900">Role:</span> Tenant</p>
            <p><span className="font-medium text-navy-900">Tenant ID:</span> <span className="font-mono break-all">{user?.uid}</span></p>
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
            Email notifications sent to <span className="font-medium text-navy-900">{user?.email}</span>.
          </p>
          <PreferenceRow label="Lease updates & signatures" defaultOn />
          <PreferenceRow label="Payment confirmations" defaultOn />
          <PreferenceRow label="Application decisions" defaultOn />
          <PreferenceRow label="Maintenance updates" defaultOn />
          <PreferenceRow label="Message notifications" />
          <PreferenceRow label="RGE score updates" />
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
