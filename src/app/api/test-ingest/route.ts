import { NextResponse } from "next/server";
import { upsertDeal } from "@/lib/dealsIngest";

export async function GET() {
  try {
    const sampleDeal = {
      address: "55 test lane",
      city: "atlanta",
      state: "ga",
      list_price: 275000,
      rent_estimate: 2100,
      url: "https://example.com/listing",
      source: "manual",
      source_url: "https://example.com/listing",
      scraped_at: new Date().toISOString(),
      is_off_market: false,
      status: "active"
    };

    const result = await upsertDeal(sampleDeal);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
