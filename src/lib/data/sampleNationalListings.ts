import type { NationalListingDoc } from "@/lib/types/models";

const P = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

// Curated high-res Unsplash apartment photos
const PHOTOS = [
  P("photo-1560448204-e02f11c3d0e2"), // modern living room
  P("photo-1522708323590-d24dbb6b0267"), // contemporary interior
  P("photo-1545324418-cc1a3fa10c00"), // apartment building exterior
  P("photo-1567496898669-ee935f5f647a"), // bright open apartment
  P("photo-1600566753086-00f18fb6b3ea"), // contemporary kitchen
  P("photo-1502672260266-1c1ef2d93688"), // stylish living space
  P("photo-1493809842364-78817add7ffb"), // open-plan living
  P("photo-1484154218962-a197022b5858"), // bright kitchen
  P("photo-1558618666-fcd25c85cd64"), // luxury apartment
  P("photo-1615873968403-89e068629265"), // apartment complex
  P("photo-1554995207-c18c203602cb"), // city apartment building
  P("photo-1536376072261-38c75010e6c9"), // modern bedroom
  P("photo-1416331108676-a22ccb276e35"), // urban apartment
  P("photo-1512917774080-9991f1c4c750"), // residential exterior
  P("photo-1486325212027-8081e485255e"), // building facade
];

function pics(...indices: number[]): string[] {
  return indices.map((i) => PHOTOS[i % PHOTOS.length]);
}

const NOW = Date.now();

function listing(
  id: string,
  addressLine1: string,
  city: string,
  state: string,
  zipCode: string,
  beds: number,
  baths: number,
  sqft: number,
  rent: number,
  propertyType: string,
  photos: string[],
): NationalListingDoc {
  return {
    id,
    source: "rentcast",
    formattedAddress: `${addressLine1}, ${city}, ${state} ${zipCode}`,
    addressLine1,
    city,
    state,
    zipCode,
    beds,
    baths,
    sqft,
    rent,
    propertyType,
    photos,
    status: "Active",
    daysOnMarket: null,
    latitude: null,
    longitude: null,
    agentName: null,
    agentEmail: null,
    agentPhone: null,
    description: null,
    listingUrl: null,
    listedDate: null,
    syncedAt: NOW,
  };
}

export const SAMPLE_NATIONAL_LISTINGS: NationalListingDoc[] = [
  // ── New York, NY ─────────────────────────────────────────────────────────────
  listing("sample_nyc_1", "123 Broadway, Apt 4B",            "New York", "NY", "10006", 1, 1,  650, 3200, "Apartment",  pics(0, 4)),
  listing("sample_nyc_2", "456 Park Ave South, Apt 12A",     "New York", "NY", "10016", 2, 2,  950, 4800, "Apartment",  pics(1, 6)),
  listing("sample_nyc_3", "789 West 72nd St, Apt 3C",        "New York", "NY", "10023", 0, 1,  450, 2100, "Studio",     pics(2, 9)),
  listing("sample_nyc_4", "212 East 23rd St, Apt 8B",        "New York", "NY", "10010", 2, 1,  800, 3900, "Apartment",  pics(5, 3)),

  // ── Los Angeles, CA ───────────────────────────────────────────────────────────
  listing("sample_lax_1", "5420 Wilshire Blvd, Apt 203",     "Los Angeles", "CA", "90036", 1, 1,  750, 2200, "Apartment",  pics(3, 7)),
  listing("sample_lax_2", "8732 Sunset Blvd, Apt 5",         "Los Angeles", "CA", "90069", 2, 2, 1100, 3400, "Condo",      pics(8, 1)),
  listing("sample_lax_3", "2341 Cahuenga Blvd, Apt 101",     "Los Angeles", "CA", "90068", 0, 1,  500, 1650, "Studio",     pics(6, 4)),

  // ── Chicago, IL ──────────────────────────────────────────────────────────────
  listing("sample_chi_1", "1420 S Michigan Ave, Apt 15B",    "Chicago", "IL", "60605", 1, 1,  700, 1600, "Apartment",  pics(10, 2)),
  listing("sample_chi_2", "742 N Clark St, Apt 4",           "Chicago", "IL", "60654", 2, 2, 1000, 2400, "Apartment",  pics(0,  5)),
  listing("sample_chi_3", "3218 N Halsted St, Apt 2",        "Chicago", "IL", "60657", 0, 1,  520, 1100, "Studio",     pics(11, 8)),

  // ── Atlanta, GA ──────────────────────────────────────────────────────────────
  listing("sample_atl_1", "580 Peachtree St NE, Apt 901",    "Atlanta", "GA", "30308", 1, 1,  680, 1450, "Apartment",  pics(7,  0)),
  listing("sample_atl_2", "1432 Monroe Dr NE, Apt 5",        "Atlanta", "GA", "30324", 2, 2, 1050, 2100, "Townhome",   pics(13, 6)),
  listing("sample_atl_3", "820 Ralph McGill Blvd, Apt 12",   "Atlanta", "GA", "30306", 0, 1,  480, 1050, "Studio",     pics(9,  3)),

  // ── Houston, TX ──────────────────────────────────────────────────────────────
  listing("sample_hou_1", "4300 Main St, Apt 202",           "Houston", "TX", "77002", 1, 1,  720, 1250, "Apartment",  pics(4, 11)),
  listing("sample_hou_2", "2800 Allen Pkwy, Apt 1504",       "Houston", "TX", "77019", 2, 2, 1100, 1900, "Apartment",  pics(1,  7)),
  listing("sample_hou_3", "1200 Studemont St, Apt 7",        "Houston", "TX", "77007", 0, 1,  500,  950, "Studio",     pics(5, 12)),

  // ── Buffalo, NY ──────────────────────────────────────────────────────────────
  listing("sample_buf_1", "120 Delaware Ave, Apt 3B",        "Buffalo", "NY", "14202", 1, 1,  650,  900, "Apartment",  pics(2,  8)),
  listing("sample_buf_2", "345 Elmwood Ave, Apt 2",          "Buffalo", "NY", "14222", 2, 1,  850, 1200, "Apartment",  pics(14, 0)),
  listing("sample_buf_3", "890 Main St, Apt 4A",             "Buffalo", "NY", "14203", 0, 1,  420,  700, "Studio",     pics(10, 5)),
  listing("sample_buf_4", "55 Allen St, Apt 1",              "Buffalo", "NY", "14202", 2, 2,  950, 1400, "Apartment",  pics(6,  3)),

  // ── Miami, FL ────────────────────────────────────────────────────────────────
  listing("sample_mia_1", "1875 Brickell Ave, Apt 12C",      "Miami", "FL", "33129", 1, 1,  720, 2100, "Condo",      pics(8, 13)),
  listing("sample_mia_2", "300 S Biscayne Blvd, Apt 2201",   "Miami", "FL", "33131", 2, 2, 1100, 3200, "Apartment",  pics(3,  1)),
  listing("sample_mia_3", "7801 Collins Ave, Apt 5",         "Miami Beach", "FL", "33141", 0, 1, 480, 1600, "Studio", pics(7, 11)),

  // ── Denver, CO ───────────────────────────────────────────────────────────────
  listing("sample_den_1", "1600 Glenarm Pl, Apt 810",        "Denver", "CO", "80202", 1, 1,  700, 1700, "Apartment",  pics(9,  4)),
  listing("sample_den_2", "2800 Zuni St, Apt 312",           "Denver", "CO", "80211", 2, 2,  950, 2300, "Apartment",  pics(0, 14)),
  listing("sample_den_3", "4000 E 8th Ave, Apt 5",           "Denver", "CO", "80220", 0, 1,  480, 1200, "Studio",     pics(12, 6)),

  // ── Seattle, WA ──────────────────────────────────────────────────────────────
  listing("sample_sea_1", "1420 2nd Ave, Apt 1610",          "Seattle", "WA", "98101", 1, 1,  650, 2200, "Apartment",  pics(5, 10)),
  listing("sample_sea_2", "3018 NE 55th St, Apt 3",          "Seattle", "WA", "98105", 2, 2,  900, 2800, "Apartment",  pics(2,  7)),
  listing("sample_sea_3", "500 E Pike St, Apt 402",          "Seattle", "WA", "98122", 0, 1,  480, 1700, "Studio",     pics(13, 0)),

  // ── Phoenix, AZ ──────────────────────────────────────────────────────────────
  listing("sample_phx_1", "4201 N Central Ave, Apt 1205",    "Phoenix", "AZ", "85012", 1, 1,  750, 1300, "Apartment",  pics(11, 3)),
  listing("sample_phx_2", "7120 E Camelback Rd, Apt 302",    "Scottsdale", "AZ", "85251", 2, 2, 1050, 1900, "Condo",   pics(4,  8)),
  listing("sample_phx_3", "2323 S Mill Ave, Apt 8",          "Tempe", "AZ", "85282", 0, 1,  500,  950, "Studio",     pics(1, 14)),
];
