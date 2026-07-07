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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("square");
}

// Only true credentials go here — Secret Manager-backed secrets can't share a
// name with a plain env var, and functions/.env (written by CI) already sets
// SQUARE_LOCATION_ID / SQUARE_APPLICATION_ID / SQUARE_OAUTH_REDIRECT_URI as
// plain vars, which isn't secret info anyway.
export const SQUARE_SECRETS = ["SQUARE_ACCESS_TOKEN"] as const;

export const SQUARE_OAUTH_SECRETS = [
  ...SQUARE_SECRETS,
  "SQUARE_APPLICATION_SECRET",
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

// Square decline codes → messages a non-technical user can act on.
// https://developer.squareup.com/docs/payment-card-support-by-country (error codes)
const FRIENDLY_DECLINES: Record<string, string> = {
  INSUFFICIENT_FUNDS:
    "Your card was declined for insufficient funds. Add funds or try a different card.",
  TRANSACTION_LIMIT:
    "Your bank declined this charge because it exceeds a spending limit on your card. Try a different card, or ask your bank to raise the limit.",
  CARD_EXPIRED: "This card has expired. Please use a different card.",
  EXPIRATION_FAILURE: "The expiration date doesn't match this card. Double-check it and try again.",
  INVALID_EXPIRATION: "The expiration date is invalid. Double-check it and try again.",
  CVV_FAILURE: "The security code (CVV) doesn't match this card. Double-check the 3-digit code and try again.",
  ADDRESS_VERIFICATION_FAILURE:
    "The billing ZIP code doesn't match this card. Double-check it and try again.",
  INVALID_CARD: "This card number appears to be invalid. Double-check it and try again.",
  INVALID_CARD_DATA: "The card details appear to be invalid. Double-check them and try again.",
  PAN_FAILURE: "This card number appears to be invalid. Double-check it and try again.",
  CARD_NOT_SUPPORTED: "This card type isn't supported. Please use a different card.",
  CARD_DECLINED_VERIFICATION_REQUIRED:
    "Your bank requires additional verification for this charge. Try again, or contact your bank.",
  GENERIC_DECLINE:
    "Your bank declined this charge without giving a reason. Contact your bank, or try a different card.",
  CARD_DECLINED: "Your bank declined this charge. Contact your bank, or try a different card.",
};

/** Extracts a user-friendly message from a Square SDK error. Square's
 * ApiError.message is generic HTTP noise ("Response status code was not
 * ok: 402.") — the actionable code lives in its `errors` array. Duck-typed
 * rather than instanceof ApiError so this never forces an eager import of
 * the square package (see loadSquare above). */
export function friendlySquareError(err: unknown, fallback: string): string {
  const errors =
    (err as { errors?: Array<{ code?: string; detail?: string }> })?.errors ??
    (err as { result?: { errors?: Array<{ code?: string; detail?: string }> } })?.result?.errors;
  const first = Array.isArray(errors) ? errors[0] : undefined;
  if (first?.code && FRIENDLY_DECLINES[first.code]) return FRIENDLY_DECLINES[first.code];
  if (first?.detail) return first.detail;
  if (err instanceof Error && err.message && !/status code/i.test(err.message)) return err.message;
  return fallback;
}
