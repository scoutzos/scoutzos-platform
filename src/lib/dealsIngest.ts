// src/lib/dealsIngest.ts
import { supabaseAdmin } from "./supabase/admin";

export type RawDealInput = {
  address: string;
  city: string;
  state: string;
  zipcode?: string;
  list_price: number;
  rent_estimate?: number | null;
  zillow_rent_estimate?: number | null;
  rentcast_rent_estimate?: number | null;
  url?: string | null;
  source?: string | null;
  source_url?: string | null;
  is_off_market?: boolean;
  status?: string;
  // Property details
  beds?: number;
  baths?: number;
  sqft?: number;
  lot_size?: number;
  year_built?: number | null;
  property_type?: string;
  days_on_market?: number;
  photos?: string[];
  latitude?: number;
  longitude?: number;
};

/**
 * Upsert a deal into the `deals` table.
 * Maps RawDealInput to the actual deals table schema.
 */
export async function upsertDeal(input: RawDealInput) {
  // Map input fields to actual table columns
  const payload = {
    address_line1: input.address.trim(),
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(), // States should be uppercase (e.g., "FL")
    zip: input.zipcode || "",
    list_price: input.list_price,
    estimated_rent: input.rent_estimate ?? null,
    zillow_rent_estimate: input.zillow_rent_estimate ?? null,
    rentcast_rent_estimate: input.rentcast_rent_estimate ?? null,
    source: input.source ?? "manual",
    source_url: input.source_url ?? input.url ?? null,
    scraped_at: new Date().toISOString(),
    status: "new" as const, // Use valid DealStatus enum value
    // Property details
    beds: input.beds ?? null,
    baths: input.baths ?? null,
    sqft: input.sqft ?? null,
    lot_size: input.lot_size ?? null,
    year_built: input.year_built ?? null,
    property_type: input.property_type ?? null,
    days_on_market: input.days_on_market ?? null,
    photos: input.photos ?? [],
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  };

  // First try to find existing deal by address_line1, city, state
  const { data: existingDeal } = await supabaseAdmin
    .from("deals")
    .select("id")
    .eq("address_line1", payload.address_line1)
    .eq("city", payload.city)
    .eq("state", payload.state)
    .single();

  let result;
  if (existingDeal) {
    // Update existing deal
    const { data, error } = await supabaseAdmin
      .from("deals")
      .update({
        list_price: payload.list_price,
        estimated_rent: payload.estimated_rent,
        zillow_rent_estimate: payload.zillow_rent_estimate,
        rentcast_rent_estimate: payload.rentcast_rent_estimate,
        source_url: payload.source_url,
        scraped_at: payload.scraped_at,
        beds: payload.beds,
        baths: payload.baths,
        sqft: payload.sqft,
        lot_size: payload.lot_size,
        year_built: payload.year_built,
        property_type: payload.property_type,
        days_on_market: payload.days_on_market,
        photos: payload.photos,
        latitude: payload.latitude,
        longitude: payload.longitude,
      })
      .eq("id", existingDeal.id)
      .select()
      .single();

    if (error) {
      console.error("upsertDeal update error:", error);
      throw error;
    }
    result = data;
  } else {
    // Insert new deal
    const { data, error } = await supabaseAdmin
      .from("deals")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("upsertDeal insert error:", error);
      throw error;
    }
    result = data;
  }

  return result;
}
