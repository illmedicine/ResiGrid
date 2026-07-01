import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/firebaseAdmin";
import {
  buildSquareAuthorizeUrl,
  getSquareAppCredentials,
  getSquareOAuthClient,
} from "../lib/square";
import { claimVoucherForUid } from "./claimVoucher";
import type { SquareConnectionDoc } from "../types";

interface ConnectUrlResponse {
  url: string;
}

/** Returns the Square OAuth authorize URL. `claimToken` is round-tripped
 * through Square's `state` param so the callback can auto-claim a pending
 * voucher right after the property manager connects their account. */
export const getSquareConnectUrl = onCall<{ claimToken?: string }, Promise<ConnectUrlResponse>>(
  { region: "us-central1", cors: ["https://resigrid.co", "https://www.resigrid.co", "http://localhost:3000"] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");

    const state = Buffer.from(
      JSON.stringify({ uid, claimToken: request.data.claimToken ?? null }),
    ).toString("base64url");

    return { url: buildSquareAuthorizeUrl(state) };
  },
);

interface CompleteOAuthRequest {
  code: string;
  state: string;
}

interface CompleteOAuthResponse {
  connected: boolean;
  claimedVoucherId?: string;
  newInvitePM?: boolean;
}

export const completeSquareOAuth = onCall<CompleteOAuthRequest, Promise<CompleteOAuthResponse>>(
  { region: "us-central1", cors: ["https://resigrid.co", "https://www.resigrid.co", "http://localhost:3000"] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");

    const { code, state } = request.data;
    if (!code || !state) {
      throw new HttpsError("invalid-argument", "Missing OAuth code or state.");
    }

    let parsedState: { uid: string; claimToken: string | null };
    try {
      parsedState = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    } catch {
      throw new HttpsError("invalid-argument", "Invalid OAuth state.");
    }
    if (parsedState.uid !== uid) {
      throw new HttpsError("permission-denied", "OAuth state does not match the signed-in user.");
    }

    const { clientId, clientSecret, redirectUri } = getSquareAppCredentials();
    const oauth = getSquareOAuthClient();

    const tokenResult = await oauth.oAuthApi.obtainToken({
      clientId,
      clientSecret,
      code,
      redirectUri,
      grantType: "authorization_code",
    });

    const accessToken = tokenResult.result.accessToken;
    const refreshToken = tokenResult.result.refreshToken;
    const merchantId = tokenResult.result.merchantId;
    const expiresAt = tokenResult.result.expiresAt;
    if (!accessToken || !merchantId) {
      throw new HttpsError("internal", "Square did not return an access token.");
    }

    // Fetch the merchant's primary location to charge against later.
    const merchantClient = getSquareOAuthClient().withConfiguration({ accessToken });
    const locationsResult = await merchantClient.locationsApi.listLocations();
    const locationId = locationsResult.result.locations?.[0]?.id;
    if (!locationId) {
      throw new HttpsError("internal", "Square account has no locations.");
    }

    const connection: SquareConnectionDoc = {
      uid,
      merchantId,
      accessToken,
      refreshToken: refreshToken ?? undefined,
      locationId,
      expiresAt: expiresAt ?? undefined,
      connectedAt: Date.now(),
    };
    await db.collection("squareConnections").doc(uid).set(connection);

    let claimedVoucherId: string | undefined;
    let newInvitePM: boolean | undefined;
    if (parsedState.claimToken) {
      const result = await claimVoucherForUid(uid, parsedState.claimToken);
      claimedVoucherId = result.voucherId;
      newInvitePM = result.newInvitePM || undefined;
    }

    return { connected: true, claimedVoucherId, newInvitePM };
  },
);
