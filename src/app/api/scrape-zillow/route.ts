// src/app/api/scrape-zillow/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchByCity, searchProperties, zillowPropertyToDeal, ZillowSearchParams, ZillowProperty } from "@/lib/zillowScraper";
import { upsertDeal } from "@/lib/dealsIngest";

export type ScrapeZillowRequest = {
  city?: string;
  state?: string;
  location?: string;
  status?: "forSale" | "forRent" | "recentlySold";
  home_type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedsMin?: number;
  bedsMax?: number;
  bathsMin?: number;
  bathsMax?: number;
  sqftMin?: number;
  sqftMax?: number;
  page?: number;
  saveToDb?: boolean; // Whether to save results to database (default: true)
};

// Extended property type for API response with all fields
export type ZillowPropertyResponse = {
  address: string;
  city: string;
  state: string;
  zipcode: string;
  list_price: number;
  rent_estimate: number | null;
  url: string;
  source: string;
  source_url: string;
  is_off_market: boolean;
  status: string;
  // Additional fields
  beds: number;
  baths: number;
  sqft: number;
  lot_size: number;
  year_built: number | null;
  property_type: string;
  days_on_market: number;
  photos: string[];
  latitude: number;
  longitude: number;
};

export type ScrapeZillowResponse = {
  success: boolean;
  totalResults: number;
  savedCount: number;
  properties: ZillowPropertyResponse[];
  errors?: string[];
};

// Transform ZillowProperty to extended response format
function zillowPropertyToResponse(prop: ZillowProperty): ZillowPropertyResponse {
  return {
    address: prop.address,
    city: prop.city,
    state: prop.state,
    zipcode: prop.zipcode,
    list_price: prop.price,
    rent_estimate: prop.rentZestimate,
    url: prop.detailUrl,
    source: "zillow",
    source_url: prop.detailUrl,
    is_off_market: prop.homeStatus === "OFF_MARKET",
    status: prop.homeStatus === "FOR_SALE" ? "active" : prop.homeStatus.toLowerCase(),
    // Additional fields
    beds: prop.bedrooms,
    baths: prop.bathrooms,
    sqft: prop.livingArea,
    lot_size: prop.lotAreaValue,
    year_built: prop.yearBuilt,
    property_type: prop.homeType,
    days_on_market: prop.daysOnZillow,
    photos: prop.photos,
    latitude: prop.latitude,
    longitude: prop.longitude,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ScrapeZillowRequest = await request.json();

    // Validate required fields
    if (!body.location && (!body.city || !body.state)) {
      return NextResponse.json(
        {
          success: false,
          error: "Either 'location' or both 'city' and 'state' are required",
        },
        { status: 400 }
      );
    }

    // Build search params
    let searchResults;

    if (body.city && body.state) {
      // Use city/state search
      const options: Omit<ZillowSearchParams, "location"> = {};
      if (body.status) options.status = body.status;
      if (body.home_type) options.home_type = body.home_type;
      if (body.minPrice) options.minPrice = body.minPrice;
      if (body.maxPrice) options.maxPrice = body.maxPrice;
      if (body.bedsMin) options.bedsMin = body.bedsMin;
      if (body.bedsMax) options.bedsMax = body.bedsMax;
      if (body.bathsMin) options.bathsMin = body.bathsMin;
      if (body.bathsMax) options.bathsMax = body.bathsMax;
      if (body.sqftMin) options.sqftMin = body.sqftMin;
      if (body.sqftMax) options.sqftMax = body.sqftMax;
      if (body.page) options.page = body.page;

      searchResults = await searchByCity(body.city, body.state, options);
    } else {
      // Use location-based search
      const params: ZillowSearchParams = {
        location: body.location!,
        status: body.status,
        home_type: body.home_type,
        minPrice: body.minPrice,
        maxPrice: body.maxPrice,
        bedsMin: body.bedsMin,
        bedsMax: body.bedsMax,
        bathsMin: body.bathsMin,
        bathsMax: body.bathsMax,
        sqftMin: body.sqftMin,
        sqftMax: body.sqftMax,
        page: body.page,
      };

      searchResults = await searchProperties(params);
    }

    // Transform properties to extended response format
    const properties = searchResults.props.map(zillowPropertyToResponse);

    // Save to database if requested (default: true)
    const saveToDb = body.saveToDb !== false;
    let savedCount = 0;
    const errors: string[] = [];

    if (saveToDb) {
      for (const prop of searchResults.props) {
        try {
          await upsertDeal(zillowPropertyToDeal(prop));
          savedCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to save ${prop.address}: ${errorMessage}`);
        }
      }
    }

    const response: ScrapeZillowResponse = {
      success: true,
      totalResults: searchResults.totalResultCount,
      savedCount,
      properties,
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Zillow scrape error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// GET endpoint for simple city/state queries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const location = searchParams.get("location");
    const saveToDb = searchParams.get("saveToDb") !== "false";

    if (!location && (!city || !state)) {
      return NextResponse.json(
        {
          success: false,
          error: "Either 'location' or both 'city' and 'state' query parameters are required",
        },
        { status: 400 }
      );
    }

    // Build search options from query params
    const options: Omit<ZillowSearchParams, "location"> = {};

    const status = searchParams.get("status");
    if (status && ["forSale", "forRent", "recentlySold"].includes(status)) {
      options.status = status as "forSale" | "forRent" | "recentlySold";
    }

    const minPrice = searchParams.get("minPrice");
    if (minPrice) options.minPrice = parseInt(minPrice, 10);

    const maxPrice = searchParams.get("maxPrice");
    if (maxPrice) options.maxPrice = parseInt(maxPrice, 10);

    const bedsMin = searchParams.get("bedsMin");
    if (bedsMin) options.bedsMin = parseInt(bedsMin, 10);

    const bedsMax = searchParams.get("bedsMax");
    if (bedsMax) options.bedsMax = parseInt(bedsMax, 10);

    const page = searchParams.get("page");
    if (page) options.page = parseInt(page, 10);

    let searchResults;
    if (city && state) {
      searchResults = await searchByCity(city, state, options);
    } else {
      searchResults = await searchProperties({ location: location!, ...options });
    }

    const properties = searchResults.props.map(zillowPropertyToResponse);

    let savedCount = 0;
    const errors: string[] = [];

    if (saveToDb) {
      for (const prop of searchResults.props) {
        try {
          await upsertDeal(zillowPropertyToDeal(prop));
          savedCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to save ${prop.address}: ${errorMessage}`);
        }
      }
    }

    const response: ScrapeZillowResponse = {
      success: true,
      totalResults: searchResults.totalResultCount,
      savedCount,
      properties,
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Zillow scrape error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
