// src/lib/dealMatches.ts
import { supabase } from "@/lib/supabaseClient";

export type Deal = {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  list_price: number;
  rent_estimate: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
};

type MatchResult =
  | { deals: Deal[]; error: null }
  | { deals: Deal[]; error: string };

export async function getDealsForInvestor(investorId: string): Promise<MatchResult> {
  // 1. Load this investor's preferences
  const { data: pref, error: prefError } = await supabase
    .from("investor_preferences")
    .select("*")
    .eq("investor_id", investorId)
    .maybeSingle(); // avoids "Cannot coerce the result to a single JSON object"

  if (prefError) {
    return { deals: [], error: `Failed to load preferences: ${prefError.message}` };
  }

  if (!pref) {
    return { deals: [], error: "No preferences found for this investor." };
  }

  // 2. Build deals query based on preferences
  let query = supabase
    .from("deals")
    .select("id, address, city, state, list_price, rent_estimate, bedrooms, bathrooms")
    .gte("list_price", pref.min_price)
    .lte("list_price", pref.max_price);

  if (pref.bedrooms != null) {
    query = query.gte("bedrooms", pref.bedrooms);
  }

  if (pref.bathrooms != null) {
    query = query.gte("bathrooms", pref.bathrooms);
  }

  if (pref.preferred_city && String(pref.preferred_city).trim() !== "") {
    query = query.ilike("city", String(pref.preferred_city).trim());
  }

  const { data: deals, error: dealsError } = await query;

  if (dealsError) {
    return { deals: [], error: `Failed to load deals: ${dealsError.message}` };
  }

  return { deals: (deals ?? []) as Deal[], error: null };
}
