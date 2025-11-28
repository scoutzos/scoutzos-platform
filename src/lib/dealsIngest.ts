// src/lib/dealsIngest.ts
import { supabaseAdmin } from "./supabase/admin";

export type RawDealInput = {
  address: string;
  city: string;
  state: string;
  list_price: number;
  rent_estimate?: number | null;
  url?: string | null;
  source?: string | null;
  source_url?: string | null;
  is_off_market?: boolean;
  status?: string;
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
    zip: "", // Required field, but we don't have it from Zillow search results
    list_price: input.list_price,
    estimated_rent: input.rent_estimate ?? null,
    source: input.source ?? "manual",
    source_url: input.source_url ?? input.url ?? null,
    scraped_at: new Date().toISOString(),
    status: "new" as const, // Use valid DealStatus enum value
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
        source_url: payload.source_url,
        scraped_at: payload.scraped_at,
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
