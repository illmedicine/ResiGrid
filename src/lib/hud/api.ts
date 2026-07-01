/**
 * HUD National LIHTC (Low-Income Housing Tax Credit) Database
 * Accessed via the public ArcGIS REST feature service — no API key required.
 * Data source: https://www.huduser.gov/portal/datasets/lihtc.html
 */

import type { ListingDoc } from "@/lib/types/models";

const LIHTC_URL =
  "https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/National_LIHTC_Database/FeatureServer/0/query";

interface LihtcFeature {
  attributes: {
    PROJ_NAM?: string;
    PROJ_ADD?: string;
    PROJ_CTY?: string;
    PROJ_ST?: string;
    PROJ_ZIP?: string;
    N_UNITS?: number;
    LI_UNITS?: number;
    N_0BR?: number;
    N_1BR?: number;
    N_2BR?: number;
    N_3BR?: number;
    YR_PIS?: number;
    LATITUDE?: number;
    LONGITUDE?: number;
    OBJECTID?: number;
  };
}

interface ArcGISResponse {
  features?: LihtcFeature[];
  error?: { message: string };
}

// Approximate median rent from HUD Fair Market Rents by state (2023)
const STATE_FMR: Record<string, number> = {
  CA: 2200, NY: 2100, WA: 1900, MA: 2000, CO: 1700, NJ: 1800,
  IL: 1400, TX: 1300, FL: 1400, GA: 1300, AZ: 1400, NC: 1200,
  VA: 1600, MD: 1700, PA: 1200, OH: 1000, MI: 1000, MN: 1300,
  OR: 1700, TN: 1100, SC: 1100, KY: 900, IN: 900, WI: 1100,
  MO: 950, NV: 1400, UT: 1400, OK: 850, AR: 750, AL: 850,
  LA: 900, MS: 750, KS: 850, NE: 950, IA: 900, NM: 950,
  MT: 1000, ID: 1100, WY: 1000, SD: 850, ND: 950, AK: 1400,
  HI: 2500, ME: 1100, NH: 1400, VT: 1200, RI: 1500, CT: 1600,
  DE: 1400, WV: 750, DC: 2400,
};

function estimateRent(state: string, beds: number): number {
  const base = STATE_FMR[state] ?? 1100;
  const multiplier = beds === 0 ? 0.7 : beds === 1 ? 0.85 : beds === 2 ? 1 : beds === 3 ? 1.2 : 1.4;
  return Math.round((base * multiplier) / 50) * 50;
}

function primaryBedCount(f: LihtcFeature["attributes"]): number {
  if ((f.N_2BR ?? 0) > 0) return 2;
  if ((f.N_3BR ?? 0) > 0) return 3;
  if ((f.N_1BR ?? 0) > 0) return 1;
  return 1;
}

function mapToListing(feature: LihtcFeature, index: number): ListingDoc & { source: "hud_lihtc" } {
  const a = feature.attributes;
  const city = (a.PROJ_CTY ?? "").replace(/\b\w/g, (c) => c.toUpperCase());
  const state = a.PROJ_ST ?? "";
  const beds = primaryBedCount(a);
  const units = a.N_UNITS ?? 1;

  return {
    id: `hud-${a.OBJECTID ?? index}`,
    unitId: "",
    propertyId: `hud-prop-${a.OBJECTID ?? index}`,
    ownerId: "hud_lihtc",
    title: a.PROJ_NAM ?? `Affordable Housing — ${city}, ${state}`,
    description:
      `${a.LI_UNITS ?? units} income-restricted units. ` +
      `Built ${a.YR_PIS ?? "N/A"}. ` +
      `Part of HUD's Low-Income Housing Tax Credit program — ` +
      `contact the housing authority to check availability and income limits.`,
    rent: estimateRent(state, beds),
    beds,
    baths: 1,
    photos: [],
    city,
    state,
    zip: a.PROJ_ZIP ?? "",
    geo: a.LATITUDE && a.LONGITUDE
      ? { lat: a.LATITUDE, lng: a.LONGITUDE }
      : undefined,
    featured: false,
    status: "published",
    createdAt: 0,
    source: "hud_lihtc",
  };
}

/**
 * Search HUD LIHTC affordable housing properties by city or city+state.
 * Returns up to 25 results merged alongside ResiGrid listings.
 */
export async function searchHudListings(
  city: string,
  state?: string,
): Promise<ListingDoc[]> {
  if (!city.trim()) return [];

  const cityUpper = city.trim().toUpperCase();
  const where = state?.trim()
    ? `PROJ_CTY='${cityUpper}' AND PROJ_ST='${state.trim().toUpperCase()}'`
    : `PROJ_CTY LIKE '${cityUpper}%'`;

  const params = new URLSearchParams({
    where,
    outFields:
      "OBJECTID,PROJ_NAM,PROJ_ADD,PROJ_CTY,PROJ_ST,PROJ_ZIP,N_UNITS,LI_UNITS,N_0BR,N_1BR,N_2BR,N_3BR,YR_PIS,LATITUDE,LONGITUDE",
    returnGeometry: "false",
    resultRecordCount: "25",
    orderByFields: "N_UNITS DESC",
    f: "json",
  });

  try {
    const res = await fetch(`${LIHTC_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data: ArcGISResponse = await res.json();
    if (data.error || !data.features) return [];
    return data.features
      .filter((f) => f.attributes.PROJ_CTY)
      .map((f, i) => mapToListing(f, i));
  } catch {
    return []; // Silently fail — Firestore listings still show
  }
}
