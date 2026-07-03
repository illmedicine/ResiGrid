import { Client, Environment } from "square";
import { HttpsError } from "firebase-functions/v2/https";

function resolveEnvironment(): Environment {
  return process.env.SQUARE_ENV === "sandbox"
    ? Environment.Sandbox
    : Environment.Production;
}

const SQUARE_DOMAIN =
  process.env.SQUARE_ENV === "sandbox"
    ? "https://connect.squareupsandbox.com"
    : "https://squareup.com";

/** ResiGrid's own platform Square account — used to charge tenants and to
 * hold card-on-file vouchers for recipients who haven't connected yet. */
export function getSquareClient(): Client {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new HttpsError("failed-precondition", "Square payments are not configured on this server.");
  }
  return new Client({ accessToken, environment: resolveEnvironment() });
}

/** A Square client acting on behalf of a connected seller (via OAuth), used
 * to charge directly into their account so Square pays them out normally. */
export function getSquareClientForAccessToken(accessToken: string): Client {
  return new Client({ accessToken, environment: resolveEnvironment() });
}

/** Unauthenticated client for OAuth token exchange (uses client id/secret
 * in the request body rather than a bearer token). */
export function getSquareOAuthClient(): Client {
  return new Client({ environment: resolveEnvironment() });
}

export function getSquareLocationId(): string {
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    throw new HttpsError("failed-precondition", "Square location is not configured on this server.");
  }
  return locationId;
}

export function getSquareAppCredentials() {
  const clientId = process.env.SQUARE_APPLICATION_ID;
  const clientSecret = process.env.SQUARE_APPLICATION_SECRET;
  const redirectUri = process.env.SQUARE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new HttpsError(
      "failed-precondition",
      "Square OAuth is not configured on this server. Contact the ResiGrid administrator.",
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildSquareAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getSquareAppCredentials();
  const scopes = ["PAYMENTS_WRITE", "MERCHANT_PROFILE_READ"].join("+");
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    session: "false",
    state,
    redirect_uri: redirectUri,
  });
  return `${SQUARE_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

export function toMoneyCents(amountUsd: number) {
  return {
    amount: BigInt(Math.round(amountUsd * 100)),
    currency: "USD",
  };
}
