import type { Client as SquareClient, Environment as SquareEnvironment } from "square";
import { HttpsError } from "firebase-functions/v2/https";

// Importing 'square' eagerly at module scope has been observed to take
// 20-50s in this environment (slow to load its many bundled model files),
// which blows past the Firebase CLI's fixed 10s function-discovery timeout
// during `firebase deploy` — this file's module scope is evaluated during
// discovery, before any handler actually runs. Deferring the real require()
// into each function call (Node caches it after the first real call) keeps
// discovery fast regardless of how long constructing a client takes.
function loadSquare(): { Client: typeof SquareClient; Environment: typeof SquareEnvironment } {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("square");
}

export const SQUARE_SECRETS = [
  "SQUARE_ACCESS_TOKEN",
  "SQUARE_LOCATION_ID",
] as const;

export const SQUARE_OAUTH_SECRETS = [
  ...SQUARE_SECRETS,
  "SQUARE_APPLICATION_ID",
  "SQUARE_APPLICATION_SECRET",
  "SQUARE_OAUTH_REDIRECT_URI",
] as const;

function resolveEnvironment(): SquareEnvironment {
  const { Environment } = loadSquare();
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
export function getSquareClient(): SquareClient {
  const { Client } = loadSquare();
  const accessToken = process.env.SQUARE_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    throw new HttpsError("failed-precondition", "Square payments are not configured on this server.");
  }
  return new Client({ accessToken, environment: resolveEnvironment() });
}

/** A Square client acting on behalf of a connected seller (via OAuth), used
 * to charge directly into their account so Square pays them out normally. */
export function getSquareClientForAccessToken(accessToken: string): SquareClient {
  const { Client } = loadSquare();
  return new Client({ accessToken, environment: resolveEnvironment() });
}

/** Unauthenticated client for OAuth token exchange (uses client id/secret
 * in the request body rather than a bearer token). */
export function getSquareOAuthClient(): SquareClient {
  const { Client } = loadSquare();
  return new Client({ environment: resolveEnvironment() });
}

export function getSquareLocationId(): string {
  const locationId = process.env.SQUARE_LOCATION_ID?.trim();
  if (!locationId) {
    throw new HttpsError("failed-precondition", "Square location is not configured on this server.");
  }
  return locationId;
}

export function getSquareAppCredentials() {
  const clientId = process.env.SQUARE_APPLICATION_ID?.trim();
  const clientSecret = process.env.SQUARE_APPLICATION_SECRET?.trim();
  const redirectUri = process.env.SQUARE_OAUTH_REDIRECT_URI?.trim();
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
