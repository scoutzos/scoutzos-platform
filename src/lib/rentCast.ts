// src/lib/rentCast.ts
// RentCast API integration for rent estimates

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY || "";
const RENTCAST_BASE_URL = "https://api.rentcast.io/v1";

export type RentCastPropertyType =
  | "Single Family"
  | "Condo"
  | "Townhouse"
  | "Apartment"
  | "Multi-Family";

export type RentEstimateParams = {
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  propertyType?: RentCastPropertyType;
};

export type RentEstimateResponse = {
  rent: number;
  rentRangeLow: number;
  rentRangeHigh: number;
  latitude?: number;
  longitude?: number;
  comparables?: Array<{
    address: string;
    rent: number;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    distance: number;
  }>;
};

/**
 * Map Zillow property types to RentCast property types
 */
export function mapPropertyType(zillowType: string): RentCastPropertyType {
  const typeMap: Record<string, RentCastPropertyType> = {
    "SINGLE_FAMILY": "Single Family",
    "SingleFamily": "Single Family",
    "HOUSE": "Single Family",
    "Houses": "Single Family",
    "CONDO": "Condo",
    "Condo": "Condo",
    "TOWNHOUSE": "Townhouse",
    "Townhouse": "Townhouse",
    "APARTMENT": "Apartment",
    "Apartment": "Apartment",
    "MULTI_FAMILY": "Multi-Family",
    "MultiFamily": "Multi-Family",
  };

  return typeMap[zillowType] || "Single Family";
}

/**
 * Get rent estimate from RentCast API
 */
export async function getRentEstimate(
  params: RentEstimateParams
): Promise<RentEstimateResponse | null> {
  if (!RENTCAST_API_KEY) {
    console.warn("[RentCast] API key not configured");
    return null;
  }

  try {
    // Build the full address for the API
    const fullAddress = `${params.address}, ${params.city}, ${params.state}${params.zipCode ? ` ${params.zipCode}` : ""}`;

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("address", fullAddress);

    if (params.bedrooms) {
      queryParams.append("bedrooms", params.bedrooms.toString());
    }
    if (params.bathrooms) {
      queryParams.append("bathrooms", params.bathrooms.toString());
    }
    if (params.squareFootage) {
      queryParams.append("squareFootage", params.squareFootage.toString());
    }
    if (params.propertyType) {
      queryParams.append("propertyType", params.propertyType);
    }

    const url = `${RENTCAST_BASE_URL}/avm/rent/long-term?${queryParams.toString()}`;

    console.log("[RentCast] Requesting:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Api-Key": RENTCAST_API_KEY,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[RentCast] Error:", response.status, errorText);

      // Don't throw for rate limits or not found - just return null
      if (response.status === 429 || response.status === 404) {
        return null;
      }

      throw new Error(`RentCast API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    console.log("[RentCast] Response:", JSON.stringify(data, null, 2));

    // RentCast returns rent estimate directly
    return {
      rent: data.rent || data.rentEstimate || 0,
      rentRangeLow: data.rentRangeLow || data.rent * 0.9 || 0,
      rentRangeHigh: data.rentRangeHigh || data.rent * 1.1 || 0,
      latitude: data.latitude,
      longitude: data.longitude,
      comparables: data.comparables,
    };
  } catch (error) {
    console.error("[RentCast] Error fetching rent estimate:", error);
    return null;
  }
}

/**
 * Get rent estimate with property details from a deal
 */
export async function getRentEstimateForDeal(deal: {
  address_line1: string;
  city: string;
  state: string;
  zip?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  property_type?: string;
}): Promise<number | null> {
  const estimate = await getRentEstimate({
    address: deal.address_line1,
    city: deal.city,
    state: deal.state,
    zipCode: deal.zip,
    bedrooms: deal.beds,
    bathrooms: deal.baths,
    squareFootage: deal.sqft,
    propertyType: deal.property_type ? mapPropertyType(deal.property_type) : undefined,
  });

  return estimate?.rent || null;
}
