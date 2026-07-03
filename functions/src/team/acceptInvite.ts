import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/firebaseAdmin";

interface AcceptInviteRequest { inviteId: string; }
interface AcceptInviteResponse { adminId: string; propertyIds: string[]; }

export const acceptTeamInvite = onCall<AcceptInviteRequest, Promise<AcceptInviteResponse>>(
  { region: "us-central1", cors: ["https://resigrid.co", "https://www.resigrid.co", "http://localhost:3000"] },
  async (request) => {
    const uid = request.auth?.uid;
    const email = request.auth?.token.email;
    if (!uid || !email) throw new HttpsError("unauthenticated", "Sign in first.");

    const { inviteId } = request.data;
    if (!inviteId) throw new HttpsError("invalid-argument", "inviteId is required.");

    const inviteRef = db.collection("pmTeamInvites").doc(inviteId);
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists) throw new HttpsError("not-found", "Invite not found.");

    const invite = inviteSnap.data()!;

    if (invite.status === "revoked") {
      throw new HttpsError("permission-denied", "This invite has been revoked.");
    }
    if (invite.status === "accepted") {
      // Idempotent — already accepted, return success.
      return { adminId: invite.adminId, propertyIds: invite.propertyIds };
    }
    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      throw new HttpsError(
        "permission-denied",
        `This invite was sent to ${invite.email}. Sign in with that Google account.`,
      );
    }

    // Atomically accept the invite and update the user doc.
    await db.runTransaction(async (tx) => {
      tx.update(inviteRef, {
        status: "accepted",
        memberId: uid,
        acceptedAt: Date.now(),
      });
      tx.set(
        db.collection("users").doc(uid),
        {
          role: "property_manager",
          teamAdminId: invite.adminId,
          teamPropertyIds: invite.propertyIds,
        },
        { merge: true },
      );
    });

    return { adminId: invite.adminId, propertyIds: invite.propertyIds };
  },
);
