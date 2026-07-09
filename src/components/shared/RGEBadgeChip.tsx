"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getPrestigeTier } from "@/lib/rge/prestige";
import type { BadgeDoc, ReputationScoreDoc } from "@/lib/types/models";

interface RGEBadgeChipProps {
  /** Self-subscribes to reputationScores/{tenantId} if score/badges aren't passed in. */
  tenantId?: string;
  /** Pass already-fetched data (e.g. from useTenantRowStats) to avoid a listener per row in a list. */
  score?: number | null;
  badges?: BadgeDoc[];
}

/** Compact RGE score + prestige emoji + up to 2 badge icons, for surfacing a
 * tenant's standing wherever they're referenced to a property manager. */
export function RGEBadgeChip({ tenantId, score: scoreProp, badges: badgesProp }: RGEBadgeChipProps) {
  const [fetched, setFetched] = useState<ReputationScoreDoc | null>(null);
  const selfSubscribe = scoreProp === undefined && badgesProp === undefined && !!tenantId;

  useEffect(() => {
    if (!selfSubscribe || !tenantId) return;
    return onSnapshot(doc(db, "reputationScores", tenantId), (snap) => {
      setFetched(snap.exists() ? (snap.data() as ReputationScoreDoc) : null);
    });
  }, [selfSubscribe, tenantId]);

  const score = selfSubscribe ? fetched?.score ?? null : scoreProp ?? null;
  const badges = selfSubscribe ? fetched?.badges ?? [] : badgesProp ?? [];

  if (score === null) {
    return <span className="text-xs text-neutral-400">RGE —</span>;
  }

  const prestige = getPrestigeTier(score);
  const otherBadgeCount = badges.filter((b) => b.id !== "resident").length;

  return (
    <span
      title={`${prestige.label} · ${badges.map((b) => b.label).join(", ") || "No badges yet"}`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${prestige.badgeClass}`}
    >
      {prestige.emoji} {score}
      {otherBadgeCount > 0 && <span className="opacity-70">🎖️{otherBadgeCount}</span>}
    </span>
  );
}
