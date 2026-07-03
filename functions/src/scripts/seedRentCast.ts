/**
 * RentCast national listing seeder.
 *
 * Run via: node functions/lib/scripts/seedRentCast.js
 * (compile first with: cd functions && npx tsc)
 *
 * Environment variables required:
 *   RENTCAST_API_KEY              — RentCast API key
 *   GOOGLE_APPLICATION_CREDENTIALS — path to Firebase service-account JSON
 *
 * Flags:
 *   --force   Skip the 20-hour cooldown guard and seed immediately.
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as https from "https";

// ── Config ───────────────────────────────────────────────────────────────────

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY ?? "";
const FORCE = process.argv.includes("--force");
const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000;

const CITIES: Array<{ city: string; state: string }> = [
  { city: "New York", state: "NY" },
  { city: "Los Angeles", state: "CA" },
  { city: "Chicago", state: "IL" },
  { city: "Atlanta", state: "GA" },
  { city: "Houston", state: "TX" },
];

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function httpsGet(url: string, headers: Record<string, string>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers,
      },
      (res) => {
        let raw = "";
        res.on("data", (c: string) => { raw += c; });
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`RentCast HTTP ${res.statusCode}: ${raw}`));
          } else {
            try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
          }
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!RENTCAST_API_KEY) {
    console.error("ERROR: RENTCAST_API_KEY is not set.");
    process.exit(1);
  }

  const app = getApps()[0] ?? initializeApp();
  const db = getFirestore(app);

  const configRef = db.collection("systemConfig").doc("rentcast");
  const configSnap = await configRef.get();
  const config = configSnap.data() ?? {};

  const now = Date.now();
  const lastSyncedAt: number = config.lastSyncedAt ?? 0;
  const lastCityIndex: number = config.lastCityIndex ?? -1;

  if (!FORCE && now - lastSyncedAt < TWENTY_HOURS_MS) {
    const next = new Date(lastSyncedAt + TWENTY_HOURS_MS).toISOString();
    console.log(`[seedRentCast] Cooldown active — next sync at ${next}. Use --force to override.`);
    return;
  }

  // Rotate to next city
  const cityIndex = (lastCityIndex + 1) % CITIES.length;
  const { city, state } = CITIES[cityIndex];
  console.log(`[seedRentCast] Fetching: ${city}, ${state} (slot ${cityIndex + 1}/${CITIES.length})`);

  const apiUrl =
    `https://api.rentcast.io/v1/listings/rental/long-term` +
    `?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&status=Active&limit=500`;

  const raw = await httpsGet(apiUrl, { "X-Api-Key": RENTCAST_API_KEY });
  const listings = raw as RentCastListing[];
  console.log(`[seedRentCast] Received ${listings.length} listings`);

  // Delete stale docs for this city
  const oldSnap = await db.collection("nationalListings")
    .where("city", "==", city)
    .where("state", "==", state)
    .get();
  console.log(`[seedRentCast] Deleting ${oldSnap.size} stale docs`);

  for (const chunk of chunks(oldSnap.docs, 400)) {
    const batch = db.batch();
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // Write new listings
  for (const chunk of chunks(listings, 400)) {
    const batch = db.batch();
    for (const listing of chunk) {
      if (!listing.id) continue;
      const docId = `rc_${listing.id}`;
      batch.set(db.collection("nationalListings").doc(docId), {
        id: docId,
        source: "rentcast",
        formattedAddress: listing.formattedAddress ?? "",
        addressLine1: listing.addressLine1 ?? "",
        city: listing.city ?? city,
        state: listing.state ?? state,
        zipCode: listing.zipCode ?? "",
        beds: listing.bedrooms ?? 0,
        baths: listing.bathrooms ?? 0,
        sqft: listing.squareFootage ?? null,
        rent: listing.price ?? 0,
        propertyType: listing.propertyType ?? "Apartment",
        photos: listing.photoUrls ?? [],
        status: listing.status ?? "Active",
        daysOnMarket: listing.daysOnMarket ?? null,
        latitude: listing.latitude ?? null,
        longitude: listing.longitude ?? null,
        agentName: listing.listingAgent?.name ?? null,
        agentEmail: listing.listingAgent?.email ?? null,
        agentPhone: listing.listingAgent?.phone ?? null,
        description: listing.description ?? null,
        listingUrl: listing.url ?? null,
        listedDate: listing.listedDate ?? null,
        syncedAt: now,
      });
    }
    await batch.commit();
  }

  // Update rotation state
  await configRef.set(
    {
      lastSyncedAt: now,
      lastCityIndex: cityIndex,
      lastCity: city,
      lastState: state,
      lastCount: listings.length,
    },
    { merge: true },
  );

  console.log(`[seedRentCast] Done — seeded ${listings.length} listings for ${city}, ${state}`);
}

main().catch((err) => {
  console.error("[seedRentCast] Fatal error:", err);
  process.exit(1);
}).finally(() => process.exit(0));
