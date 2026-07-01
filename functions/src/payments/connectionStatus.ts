import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/firebaseAdmin";
import type { SquareConnectionDoc } from "../types";

interface ConnectionStatusResponse {
  connected: boolean;
  connectedAt?: number;
}

/** Reports whether the signed-in user has a connected Square account,
 * without exposing the stored access/refresh tokens to the client. */
export const getSquareConnectionStatus = onCall<unknown, Promise<ConnectionStatusResponse>>(
  { region: "us-central1", cors: ["https://resigrid.co", "https://www.resigrid.co", "http://localhost:3000"] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");

    const snap = await db.collection("squareConnections").doc(uid).get();
    if (!snap.exists) return { connected: false };

    const connection = snap.data() as SquareConnectionDoc;
    return { connected: true, connectedAt: connection.connectedAt };
  },
);
