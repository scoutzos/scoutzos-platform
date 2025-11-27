// src/lib/dealsIngest.ts
import { supabase } from "./supabaseClient";

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
 * Uses the UNIQUE(address, city, state) constraint to dedupe.
 */
export async function upsertDeal(input: RawDealInput) {
  const payload = {
    address: input.address.trim(),
    city: input.city.trim().toLowerCase(),
    state: input.state.trim().toLowerCase(),
    list_price: input.list_price,
    rent_estimate: input.rent_estimate ?? null,
    url: input.url ?? null,
    source: input.source ?? null,
    source_url: input.source_url ?? null,
    scraped_at: new Date().toISOString(),
    is_off_market: input.is_off_market ?? false,
    status: input.status ?? "active",
  };

  const { data, error } = await supabase
    .from("deals")
    .upsert(payload, {
      onConflict: "address,city,state", // uses your UNIQUE constraint
    })
    .select()
    .single();

  if (error) {
    console.error("upsertDeal error:", error);
    throw error;
  }

  return data;
}
