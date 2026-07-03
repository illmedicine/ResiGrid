"use client";

import { useAuth } from "@/lib/firebase/hooks";

/**
 * Returns the effective PM owner ID for Firestore queries.
 * - Admins: their own uid
 * - Team members: their admin's uid (from teamAdminId on their UserDoc)
 *
 * Also returns teamPropertyIds — a whitelist of property IDs the team member
 * can access. Null means no restriction (the user is an admin).
 */
export function useEffectivePMId() {
  const { user, userDoc } = useAuth();
  const isTeamMember = !!userDoc?.teamAdminId;
  const effectiveId: string | undefined = isTeamMember
    ? userDoc!.teamAdminId!
    : user?.uid;
  const teamPropertyIds: string[] | null = isTeamMember
    ? (userDoc?.teamPropertyIds ?? [])
    : null;

  return { effectiveId, isTeamMember, teamPropertyIds };
}
