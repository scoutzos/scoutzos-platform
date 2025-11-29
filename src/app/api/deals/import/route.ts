// src/app/api/deals/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, getTenantIdForUser } from "@/lib/supabase/admin";
import { DealStatus } from "@/types/deals";
import { getRentEstimate, mapPropertyType } from "@/lib/rentCast";
import { matchDealToAllBuyBoxes } from "@/lib/services/matching";

export type ImportDealInput = {
  address: string;
  city: string;
  state: string;
  zipcode?: string;
  list_price: number;
  rent_estimate?: number | null;
  zillow_rent_estimate?: number | null; // Zillow's rentZestimate
  url?: string | null;
  source?: string | null;
  source_url?: string | null;
  is_off_market?: boolean;
  status?: string;
  // Additional fields
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

export type ImportDealsRequest = {
  deals: ImportDealInput[];
};

export type ImportDealsResponse = {
  success: boolean;
  imported: number;
  failed: number;
  errors?: string[];
};

export async function POST(request: NextRequest) {
  try {
    // Authenticate user and get tenant_id
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tenantId = await getTenantIdForUser(user.id);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "User not associated with a tenant" },
        { status: 403 }
      );
    }

    const body: ImportDealsRequest = await request.json();

    if (!body.deals || !Array.isArray(body.deals)) {
      return NextResponse.json(
        { success: false, error: "deals array is required" },
        { status: 400 }
      );
    }

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const deal of body.deals) {
      try {
        // Get RentCast estimate
        let rentcastEstimate: number | null = null;
        try {
          const rentcastResult = await getRentEstimate({
            address: deal.address.trim(),
            city: deal.city.trim(),
            state: deal.state.trim().toUpperCase(),
            zipCode: deal.zipcode,
            bedrooms: deal.beds,
            bathrooms: deal.baths,
            squareFootage: deal.sqft,
            propertyType: deal.property_type ? mapPropertyType(deal.property_type) : undefined,
          });
          rentcastEstimate = rentcastResult?.rent ?? null;
        } catch (rentcastError) {
          console.warn(`[RentCast] Failed for ${deal.address}:`, rentcastError);
        }

        // Zillow rent estimate (from rentZestimate)
        const zillowEstimate = deal.zillow_rent_estimate ?? deal.rent_estimate ?? null;

        // Calculate the best rent estimate: RentCast > Zillow > 0.7% rule
        const calculatedRent = deal.list_price > 0 ? Math.round(deal.list_price * 0.007) : null;
        const bestRentEstimate = rentcastEstimate ?? zillowEstimate ?? calculatedRent;

        // Map input fields to actual table columns
        const payload = {
          tenant_id: tenantId,
          address_line1: deal.address.trim(),
          city: deal.city.trim(),
          state: deal.state.trim().toUpperCase(),
          zip: deal.zipcode || "", // Use zipcode from Zillow if available
          list_price: deal.list_price,
          estimated_rent: bestRentEstimate,
          zillow_rent_estimate: zillowEstimate,
          rentcast_rent_estimate: rentcastEstimate,
          source: deal.source ?? "manual",
          source_url: deal.source_url ?? deal.url ?? null,
          scraped_at: new Date().toISOString(),
          status: "new" as DealStatus,
          // Additional fields from Zillow
          beds: deal.beds ?? null,
          baths: deal.baths ?? null,
          sqft: deal.sqft ?? null,
          lot_size: deal.lot_size ?? null,
          year_built: deal.year_built ?? null,
          property_type: deal.property_type ?? null,
          days_on_market: deal.days_on_market ?? null,
          photos: deal.photos ?? [],
          latitude: deal.latitude ?? null,
          longitude: deal.longitude ?? null,
        };

        // First try to find existing deal by address_line1, city, state for this tenant
        const { data: existingDeal } = await supabaseAdmin
          .from("deals")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("address_line1", payload.address_line1)
          .eq("city", payload.city)
          .eq("state", payload.state)
          .single();

        let dealId: string | null = null;

        if (existingDeal) {
          // Update existing deal with all fields
          const { error } = await supabaseAdmin
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
            .eq("id", existingDeal.id);

          if (error) {
            throw error;
          }
          dealId = existingDeal.id;
        } else {
          // Insert new deal
          const { data: newDeal, error } = await supabaseAdmin
            .from("deals")
            .insert(payload)
            .select("id")
            .single();

          if (error) {
            throw error;
          }
          dealId = newDeal?.id ?? null;
        }

        // Auto-match deal to all buy boxes (run in background)
        if (dealId) {
          matchDealToAllBuyBoxes(dealId, tenantId).catch(err =>
            console.error(`[Auto-Match] Failed for deal ${dealId}:`, err)
          );
        }

        imported++;
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${deal.address}: ${errorMessage}`);
        console.error(`Failed to import ${deal.address}:`, error);
      }
    }

    const response: ImportDealsResponse = {
      success: true,
      imported,
      failed,
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Import deals error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
