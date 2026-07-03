/**
 * RentCast national listing seeder — Firestore REST API edition.
 *
 * Uses the Firestore REST API with a Google OAuth access token obtained
 * by exchanging FIREBASE_TOKEN (firebase login:ci refresh token).
 * OAuth tokens from a project-owner account bypass Firestore security
 * rules via IAM — no service account JSON required.
 *
 * Compile: cd functions && npx tsc --project tsconfig.seed.json
 * Run:     node lib/scripts/seedRentCast.js [--force]
 *
 * Environment:
 *   RENTCAST_API_KEY  — RentCast API key
 *   FIREBASE_TOKEN    — Firebase CLI refresh token (firebase login:ci)
 */

import * as https from "https";
import * as qs from "querystring";

// ── Config ────────────────────────────────────────────────────────────────────

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY ?? "";
const FIREBASE_TOKEN   = process.env.FIREBASE_TOKEN   ?? "";
const FORCE            = process.argv.includes("--force");

const PROJECT_ID  = "resigrid-96c9c";
const DB_ROOT     = `projects/${PROJECT_ID}/databases/(default)/documents`;
const FS_HOST     = "firestore.googleapis.com";
const FS_BASE     = `/v1/${DB_ROOT}`;

const FIREBASE_CLI_CLIENT_ID     = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const FIREBASE_CLI_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000;
const BATCH_SIZE      = 450; // Firestore REST commit limit is 500

const CITIES: Array<{ city: string; state: string }> = [
  { city: "New York",    state: "NY" },
  { city: "Los Angeles", state: "CA" },
  { city: "Chicago",     state: "IL" },
  { city: "Atlanta",     state: "GA" },
  { city: "Houston",     state: "TX" },
  { city: "Buffalo",     state: "NY" },
  { city: "Miami",       state: "FL" },
  { city: "Denver",      state: "CO" },
  { city: "Seattle",     state: "WA" },
  { city: "Phoenix",     state: "AZ" },
];

// Curated Unsplash apartment photos used as fallback when API provides none.
// Assigned deterministically by listing ID so the same listing always shows
// the same photo across seeding runs.
const PHOTO_POOL = [
  "photo-1545324418-cc1a3fa10c00", // apartment building exterior
  "photo-1560448204-e02f11c3d0e2", // modern living room
  "photo-1522708323590-d24dbb6b0267", // contemporary bedroom
  "photo-1558618666-fcd25c85cd64", // luxury apartment
  "photo-1554995207-c18c203602cb", // city apartment building
  "photo-1567496898669-ee935f5f647a", // bright apartment interior
  "photo-1512917774080-9991f1c4c750", // house exterior
  "photo-1493809842364-78817add7ffb", // open-plan living
  "photo-1416331108676-a22ccb276e35", // urban apartment
  "photo-1536376072261-38c75010e6c9", // modern bedroom interior
  "photo-1600566753086-00f18fb6b3ea", // contemporary kitchen
  "photo-1615873968403-89e068629265", // apartment complex exterior
  "photo-1502672260266-1c1ef2d93688", // stylish living space
  "photo-1484154218962-a197022b5858", // bright kitchen
  "photo-1486325212027-8081e485255e", // building facade
];

function pickPhotos(listingId: string, apiPhotos: string[] | undefined): string[] {
  if (apiPhotos && apiPhotos.length > 0) return apiPhotos;
  // Deterministic pick based on listing ID characters
  const idx = listingId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % PHOTO_POOL.length;
  const photo = `https://images.unsplash.com/${PHOTO_POOL[idx]}?auto=format&fit=crop&w=800&q=80`;
  return [photo];
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function httpsRequest(
  options: https.RequestOptions,
  body?: string,
): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (c: string) => { raw += c; });
      res.on("end", () => {
        try {
          const data = raw ? JSON.parse(raw) : null;
          resolve({ status: res.statusCode ?? 0, data });
        } catch {
          resolve({ status: res.statusCode ?? 0, data: raw });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function httpsGet(url: string, headers: Record<string, string>): Promise<unknown> {
  const parsed = new URL(url);
  const { status, data } = await httpsRequest({
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    method: "GET",
    headers,
  });
  if (status !== 200) throw new Error(`GET ${url} → ${status}: ${JSON.stringify(data)}`);
  return data;
}

async function httpsPost(
  hostname: string,
  path: string,
  body: string,
  headers: Record<string, string>,
): Promise<unknown> {
  const { status, data } = await httpsRequest(
    { hostname, path, method: "POST", headers: { ...headers, "Content-Length": Buffer.byteLength(body).toString() } },
    body,
  );
  if (status < 200 || status >= 300) throw new Error(`POST ${path} → ${status}: ${JSON.stringify(data)}`);
  return data;
}

// ── Firestore value encoding ──────────────────────────────────────────────────

type FsValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { stringValue: string }
  | { arrayValue: { values: FsValue[] } }
  | { mapValue: { fields: Record<string, FsValue> } };

function encodeValue(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean")        return { booleanValue: v };
  if (typeof v === "number") {
    if (Number.isInteger(v))         return { integerValue: String(v) };
    return { doubleValue: v };
  }
  if (typeof v === "string")         return { stringValue: v };
  if (Array.isArray(v))              return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === "object")         return { mapValue: { fields: encodeFields(v as Record<string, unknown>) } };
  return { nullValue: null };
}

function encodeFields(obj: Record<string, unknown>): Record<string, FsValue> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, encodeValue(v)]));
}

function decodeValue(fv: FsValue): unknown {
  if ("nullValue"    in fv) return null;
  if ("booleanValue" in fv) return fv.booleanValue;
  if ("integerValue" in fv) return Number(fv.integerValue);
  if ("doubleValue"  in fv) return fv.doubleValue;
  if ("stringValue"  in fv) return fv.stringValue;
  if ("arrayValue"   in fv) return (fv.arrayValue.values ?? []).map(decodeValue);
  if ("mapValue"     in fv) return decodeDoc(fv.mapValue.fields);
  return null;
}

function decodeDoc(fields: Record<string, FsValue>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decodeValue(v)]));
}

// ── Firestore REST operations ─────────────────────────────────────────────────

function fsHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function fsGetDoc(path: string, token: string): Promise<Record<string, unknown> | null> {
  const { status, data } = await httpsRequest({
    hostname: FS_HOST, path: `${FS_BASE}/${path}`, method: "GET", headers: fsHeaders(token),
  });
  if (status === 404) return null;
  if (status !== 200) throw new Error(`fsGetDoc ${path} → ${status}`);
  const doc = data as { fields?: Record<string, FsValue> };
  return doc.fields ? decodeDoc(doc.fields) : {};
}

async function fsSetDoc(
  path: string,
  fields: Record<string, unknown>,
  token: string,
  merge = false,
): Promise<void> {
  const encoded = encodeFields(fields);
  const fieldPaths = Object.keys(encoded).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  const qs2 = merge ? `?${fieldPaths}` : "";
  const body = JSON.stringify({ fields: encoded });
  await httpsPost(FS_HOST, `${FS_BASE}/${path}${qs2}`, body, {
    ...fsHeaders(token), "X-HTTP-Method-Override": "PATCH",
  });
}

/** Patch a doc (merge) using standard PATCH */
async function fsPatchDoc(
  path: string,
  fields: Record<string, unknown>,
  token: string,
): Promise<void> {
  const encoded = encodeFields(fields);
  const fieldPaths = Object.keys(encoded).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  const body = JSON.stringify({ fields: encoded });
  const { status, data } = await httpsRequest(
    {
      hostname: FS_HOST,
      path: `${FS_BASE}/${path}?${fieldPaths}`,
      method: "PATCH",
      headers: { ...fsHeaders(token), "Content-Length": Buffer.byteLength(body).toString() },
    },
    body,
  );
  if (status < 200 || status >= 300) throw new Error(`fsPatchDoc ${path} → ${status}: ${JSON.stringify(data)}`);
}

/** Run a structured query and return all matching document names. */
async function fsQuery(
  collection: string,
  whereClauses: Array<{ field: string; op: string; value: FsValue }>,
  token: string,
): Promise<string[]> {
  const filters = whereClauses.map((w) => ({
    fieldFilter: { field: { fieldPath: w.field }, op: w.op, value: w.value },
  }));
  const body = JSON.stringify({
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: filters.length === 1
        ? filters[0]
        : { compositeFilter: { op: "AND", filters } },
      select: { fields: [{ fieldPath: "__name__" }] },
    },
  });
  const { status, data } = await httpsRequest(
    {
      hostname: FS_HOST,
      path: `${FS_BASE}:runQuery`,
      method: "POST",
      headers: { ...fsHeaders(token), "Content-Length": Buffer.byteLength(body).toString() },
    },
    body,
  );
  if (status < 200 || status >= 300) throw new Error(`fsQuery → ${status}: ${JSON.stringify(data)}`);
  const results = data as Array<{ document?: { name: string } }>;
  return results.filter((r) => r.document).map((r) => r.document!.name);
}

/** Commit a batch of write operations (max 500). Handles chunking internally. */
async function fsCommit(writes: unknown[], token: string): Promise<void> {
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const chunk = writes.slice(i, i + BATCH_SIZE);
    const body = JSON.stringify({ writes: chunk });
    await httpsPost(
      FS_HOST,
      `/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`,
      body,
      fsHeaders(token),
    );
  }
}

// ── OAuth token exchange ──────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const body = qs.stringify({
    client_id:     FIREBASE_CLI_CLIENT_ID,
    client_secret: FIREBASE_CLI_CLIENT_SECRET,
    refresh_token: FIREBASE_TOKEN,
    grant_type:    "refresh_token",
  });
  const data = await httpsPost(
    "oauth2.googleapis.com",
    "/token",
    body,
    { "Content-Type": "application/x-www-form-urlencoded" },
  ) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  console.log("[seedRentCast] Access token obtained");
  return data.access_token;
}

// ── RentCast types ────────────────────────────────────────────────────────────

interface RentCastListing {
  id?: string;
  formattedAddress?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  price?: number;
  propertyType?: string;
  photoUrls?: string[];
  status?: string;
  daysOnMarket?: number;
  latitude?: number;
  longitude?: number;
  listingAgent?: { name?: string; email?: string; phone?: string };
  description?: string;
  url?: string;
  listedDate?: string;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!RENTCAST_API_KEY) { console.error("ERROR: RENTCAST_API_KEY is not set."); process.exit(1); }
  if (!FIREBASE_TOKEN)   { console.error("ERROR: FIREBASE_TOKEN is not set.");   process.exit(1); }

  const token = await getAccessToken();
  const now   = Date.now();

  // Cooldown guard
  const config = await fsGetDoc("systemConfig/rentcast", token) ?? {};
  const lastSyncedAt: number  = (config.lastSyncedAt  as number)  ?? 0;
  const lastCityIndex: number = (config.lastCityIndex as number) ?? -1;

  if (!FORCE && now - lastSyncedAt < TWENTY_HOURS_MS) {
    const next = new Date(lastSyncedAt + TWENTY_HOURS_MS).toISOString();
    console.log(`[seedRentCast] Cooldown active — next sync at ${next}. Use --force to override.`);
    return;
  }

  // Rotate city
  const cityIndex = (lastCityIndex + 1) % CITIES.length;
  const { city, state } = CITIES[cityIndex];
  console.log(`[seedRentCast] Fetching: ${city}, ${state} (slot ${cityIndex + 1}/${CITIES.length})`);

  // Fetch from RentCast
  const apiUrl =
    `https://api.rentcast.io/v1/listings/rental/long-term` +
    `?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&status=Active&limit=500`;

  const listings = await httpsGet(apiUrl, { "X-Api-Key": RENTCAST_API_KEY }) as RentCastListing[];
  console.log(`[seedRentCast] Received ${listings.length} listings from RentCast`);

  // Delete stale docs for this city
  const oldNames = await fsQuery(
    "nationalListings",
    [
      { field: "city",  op: "EQUAL", value: { stringValue: city } },
      { field: "state", op: "EQUAL", value: { stringValue: state } },
    ],
    token,
  );
  console.log(`[seedRentCast] Deleting ${oldNames.length} stale docs`);
  const deleteWrites = oldNames.map((name) => ({ delete: name }));

  // Build write ops for new listings
  const insertWrites = listings
    .filter((l) => l.id)
    .map((l) => {
      const docId = `rc_${l.id}`;
      const name  = `${DB_ROOT}/nationalListings/${docId}`;
      return {
        update: {
          name,
          fields: encodeFields({
            id: docId, source: "rentcast",
            formattedAddress: l.formattedAddress ?? "",
            addressLine1: l.addressLine1 ?? "",
            city: l.city ?? city, state: l.state ?? state, zipCode: l.zipCode ?? "",
            beds: l.bedrooms ?? 0, baths: l.bathrooms ?? 0,
            sqft: l.squareFootage ?? null, rent: l.price ?? 0,
            propertyType: l.propertyType ?? "Apartment",
            photos: pickPhotos(docId, l.photoUrls),
            status: l.status ?? "Active",
            daysOnMarket: l.daysOnMarket ?? null,
            latitude: l.latitude ?? null, longitude: l.longitude ?? null,
            agentName: l.listingAgent?.name ?? null,
            agentEmail: l.listingAgent?.email ?? null,
            agentPhone: l.listingAgent?.phone ?? null,
            description: l.description ?? null,
            listingUrl: l.url ?? null,
            listedDate: l.listedDate ?? null,
            syncedAt: now,
          }),
        },
      };
    });

  await fsCommit([...deleteWrites, ...insertWrites], token);
  console.log(`[seedRentCast] Committed ${insertWrites.length} listings`);

  // Update config
  await fsPatchDoc("systemConfig/rentcast", {
    lastSyncedAt: now,
    lastCityIndex: cityIndex,
    lastCity: city,
    lastState: state,
    lastCount: listings.length,
  }, token);

  console.log(`[seedRentCast] Done — seeded ${listings.length} listings for ${city}, ${state}`);
}

main().catch((err) => {
  console.error("[seedRentCast] Fatal error:", err);
  process.exit(1);
}).finally(() => process.exit(0));
