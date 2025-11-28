// src/app/api/deals/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, getTenantIdForUser } from "@/lib/supabase/admin";
import { DealStatus } from "@/types/deals";

export type ImportDealInput = {
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
        // Map input fields to actual table columns
        const payload = {
          tenant_id: tenantId,
          address_line1: deal.address.trim(),
          city: deal.city.trim(),
          state: deal.state.trim().toUpperCase(),
          zip: "", // Required field, but we don't have it from search results
          list_price: deal.list_price,
          estimated_rent: deal.rent_estimate ?? null,
          source: deal.source ?? "manual",
          source_url: deal.source_url ?? deal.url ?? null,
          scraped_at: new Date().toISOString(),
          status: "new" as DealStatus,
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

        if (existingDeal) {
          // Update existing deal
          const { error } = await supabaseAdmin
            .from("deals")
            .update({
              list_price: payload.list_price,
              estimated_rent: payload.estimated_rent,
              source_url: payload.source_url,
              scraped_at: payload.scraped_at,
            })
            .eq("id", existingDeal.id);

          if (error) {
            throw error;
          }
        } else {
          // Insert new deal
          const { error } = await supabaseAdmin
            .from("deals")
            .insert(payload);

          if (error) {
            throw error;
          }
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
