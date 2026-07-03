"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";
import { Check, Copy, MailPlus, Users, X } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { pmTeamInvitesCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useOwnerProperties } from "@/lib/hooks/useOwnerProperties";
import { usePMSubscription } from "@/lib/hooks/usePMSubscription";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { PMTeamInviteDoc, PropertyDoc } from "@/lib/types/models";

export default function PmTeamPage() {
  const { user, userDoc } = useAuth();
  const { properties } = useOwnerProperties(user?.uid);
  const { tierConfig } = usePMSubscription(user?.uid);
  const [invites, setInvites] = useState<PMTeamInviteDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [selectedPropIds, setSelectedPropIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(pmTeamInvitesCol(), where("adminId", "==", user.uid));
    return onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => d.data())
          .sort((a, b) => b.createdAt - a.createdAt);
        setInvites(docs);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user]);

  const maxTeamMembers = tierConfig?.maxTeamMembers ?? 1;
  const activeMembers = invites.filter((i) => i.status === "accepted");
  const pendingInvites = invites.filter((i) => i.status === "pending");
  const slotsUsed = activeMembers.length + pendingInvites.length;
  const atLimit = slotsUsed >= maxTeamMembers;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !userDoc || !email.trim() || selectedPropIds.length === 0) {
      setSendError("Enter an email and select at least one property.");
      return;
    }
    if (atLimit) {
      setSendError(
        `Your ${tierConfig?.name} plan allows ${maxTeamMembers} team member${maxTeamMembers === 1 ? "" : "s"}. Upgrade to invite more.`,
      );
      return;
    }
    setSendError(null);
    setSending(true);
    try {
      const ref = doc(pmTeamInvitesCol());
      await setDoc(ref, {
        id: ref.id,
        adminId: user.uid,
        adminName: userDoc.displayName,
        email: email.trim().toLowerCase(),
        propertyIds: selectedPropIds,
        status: "pending",
        createdAt: Date.now(),
      } satisfies PMTeamInviteDoc);
      setEmail("");
      setSelectedPropIds([]);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to create invite.");
    } finally {
      setSending(false);
    }
  }

  async function revokeInvite(inviteId: string) {
    await updateDoc(doc(db, "pmTeamInvites", inviteId), { status: "revoked" });
  }

  function copyInviteLink(inviteId: string) {
    const url = `${window.location.origin}/pm/team/accept?invite=${inviteId}`;
    navigator.clipboard.writeText(url).catch(() => null);
    setCopiedId(inviteId);
    setTimeout(() => setCopiedId(null), 2500);
  }

  function toggleProp(propId: string) {
    setSelectedPropIds((prev) =>
      prev.includes(propId) ? prev.filter((id) => id !== propId) : [...prev, propId],
    );
  }

  const visibleInvites = invites.filter((i) => i.status !== "revoked");

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Team</h1>
        <p className="text-sm text-neutral-600">
          Invite co-managers to oversee specific properties. They get full access to the
          properties you assign.
        </p>
      </div>

      {/* Slot usage card */}
      <Card className="p-4">
        <CardContent className="flex items-center justify-between gap-4 p-0">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-orange-100 p-2.5 text-orange-600">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy-900">
                {tierConfig?.name ?? "Your plan"} — {maxTeamMembers} team member slot{maxTeamMembers === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-neutral-500">
                {slotsUsed} of {maxTeamMembers} used · {activeMembers.length} active · {pendingInvites.length} pending
              </p>
            </div>
          </div>
          {atLimit && (
            <Button size="sm" variant="outline" href="/pricing">
              Upgrade
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Invite form */}
      {!atLimit && (
        <Card className="p-5">
          <CardContent className="flex flex-col gap-4 p-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <MailPlus className="h-4 w-4 text-orange-500" />
              Send invite
            </h2>
            <p className="text-xs text-neutral-500">
              The invitee must sign in with the Google account that matches this email address.
            </p>
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <Input
                label="Team member email"
                type="email"
                placeholder="colleague@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div>
                <p className="mb-2 text-sm font-medium text-navy-900">
                  Grant access to properties
                </p>
                {properties.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    Add a property first before inviting team members.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {properties.map((p) => (
                      <PropertyCheckbox
                        key={p.id}
                        property={p}
                        checked={selectedPropIds.includes(p.id)}
                        onChange={() => toggleProp(p.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
              {sendError && <p className="text-xs text-red-600">{sendError}</p>}
              <Button
                type="submit"
                size="sm"
                disabled={sending || !email.trim() || selectedPropIds.length === 0}
              >
                {sending ? "Creating…" : "Create invite link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-navy-900">Pending invites</h2>
          {pendingInvites.map((invite) => (
            <Card key={invite.id} className="p-4">
              <CardContent className="flex flex-col gap-2 p-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-navy-900">{invite.email}</p>
                    <p className="text-xs text-neutral-500">
                      {invite.propertyIds.length} propert
                      {invite.propertyIds.length === 1 ? "y" : "ies"} ·{" "}
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="warning">Pending</Badge>
                    <button
                      type="button"
                      onClick={() => revokeInvite(invite.id)}
                      title="Revoke invite"
                      className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyInviteLink(invite.id)}
                >
                  {copiedId === invite.id ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedId === invite.id ? "Link copied!" : "Copy invite link"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* Active members */}
      {activeMembers.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-navy-900">Active team members</h2>
          {activeMembers.map((member) => (
            <MemberRow
              key={member.id}
              invite={member}
              allProperties={properties}
              onRevoke={() => revokeInvite(member.id)}
            />
          ))}
        </section>
      )}

      {!loading && visibleInvites.length === 0 && (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">
              No team members yet.{" "}
              {!atLimit
                ? "Create an invite link above to add a co-manager."
                : "Upgrade your plan to invite team members."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PropertyCheckbox({
  property,
  checked,
  onChange,
}: {
  property: PropertyDoc;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-neutral-200 px-3 py-2 hover:bg-neutral-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 rounded border-neutral-300 accent-orange-500"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-navy-900">{property.name}</p>
        <p className="text-xs text-neutral-400">
          {property.city}, {property.state}
        </p>
      </div>
    </label>
  );
}

function MemberRow({
  invite,
  allProperties,
  onRevoke,
}: {
  invite: PMTeamInviteDoc;
  allProperties: PropertyDoc[];
  onRevoke: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>(invite.propertyIds);
  const [saving, setSaving] = useState(false);

  async function savePermissions() {
    if (!invite.memberId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", invite.memberId), {
        teamPropertyIds: selected,
      });
      await updateDoc(doc(db, "pmTeamInvites", invite.id), {
        propertyIds: selected,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function toggleProp(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-navy-900">{invite.email}</p>
            <p className="text-xs text-neutral-500">
              {invite.propertyIds.length} propert
              {invite.propertyIds.length === 1 ? "y" : "ies"} · Joined{" "}
              {invite.acceptedAt ? new Date(invite.acceptedAt).toLocaleDateString() : "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="success">Active</Badge>
            <button
              type="button"
              onClick={onRevoke}
              title="Remove member"
              className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {editing ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-neutral-600">Edit property access:</p>
            {allProperties.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggleProp(p.id)}
                  className="h-4 w-4 rounded border-neutral-300 accent-orange-500"
                />
                <span className="font-medium text-navy-900">{p.name}</span>
                <span className="text-xs text-neutral-400">
                  {p.city}, {p.state}
                </span>
              </label>
            ))}
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={savePermissions} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditing(false); setSelected(invite.propertyIds); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Edit property access
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
