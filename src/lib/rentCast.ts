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

// ============================================================
// Smart Rent Estimate Logic with Variance Handling
// ============================================================

import { RentConfidence } from '@/types/deals';

export interface SmartRentEstimate {
  estimatedRent: number;
  confidence: RentConfidence;
  variancePercent: number | null;
  sources: {
    zillow: number | null;
    rentcast: number | null;
    calculated: number | null;
  };
  displayNote: string;
  showWarning: boolean;
  showBothEstimates: boolean;
}

/**
 * Calculate smart rent estimate based on multiple sources
 * - If variance < 10%: Use average (high confidence)
 * - If variance 10-20%: Use average with warning (medium confidence)
 * - If variance > 20%: Show both separately (low confidence)
 * - If single source: Use that source (medium confidence)
 * - If neither: Use 0.7% rule (estimated)
 */
export function calculateSmartRentEstimate(
  zillowEstimate: number | null | undefined,
  rentcastEstimate: number | null | undefined,
  listPrice: number
): SmartRentEstimate {
  const zillow = zillowEstimate && zillowEstimate > 0 ? zillowEstimate : null;
  const rentcast = rentcastEstimate && rentcastEstimate > 0 ? rentcastEstimate : null;
  const calculated = listPrice > 0 ? Math.round(listPrice * 0.007) : null;

  // Case 1: Both estimates available
  if (zillow && rentcast) {
    const avg = Math.round((zillow + rentcast) / 2);
    const diff = Math.abs(zillow - rentcast);
    const variancePercent = Math.round((diff / avg) * 100);

    if (variancePercent < 10) {
      // Low variance - high confidence
      return {
        estimatedRent: avg,
        confidence: 'high',
        variancePercent,
        sources: { zillow, rentcast, calculated },
        displayNote: `Average of Zillow ($${zillow.toLocaleString()}) and RentCast ($${rentcast.toLocaleString()})`,
        showWarning: false,
        showBothEstimates: false,
      };
    } else if (variancePercent <= 20) {
      // Medium variance - show warning
      return {
        estimatedRent: avg,
        confidence: 'medium',
        variancePercent,
        sources: { zillow, rentcast, calculated },
        displayNote: `Average of Zillow ($${zillow.toLocaleString()}) and RentCast ($${rentcast.toLocaleString()}) - ${variancePercent}% variance`,
        showWarning: true,
        showBothEstimates: false,
      };
    } else {
      // High variance - show both separately
      return {
        estimatedRent: avg, // Still use average for calculations
        confidence: 'low',
        variancePercent,
        sources: { zillow, rentcast, calculated },
        displayNote: `High variance (${variancePercent}%) - review both estimates`,
        showWarning: true,
        showBothEstimates: true,
      };
    }
  }

  // Case 2: Only Zillow available
  if (zillow && !rentcast) {
    return {
      estimatedRent: zillow,
      confidence: 'medium',
      variancePercent: null,
      sources: { zillow, rentcast: null, calculated },
      displayNote: 'Zillow estimate (single source)',
      showWarning: false,
      showBothEstimates: false,
    };
  }

  // Case 3: Only RentCast available
  if (!zillow && rentcast) {
    return {
      estimatedRent: rentcast,
      confidence: 'medium',
      variancePercent: null,
      sources: { zillow: null, rentcast, calculated },
      displayNote: 'RentCast estimate (single source)',
      showWarning: false,
      showBothEstimates: false,
    };
  }

  // Case 4: Neither available - use 0.7% rule
  return {
    estimatedRent: calculated || 0,
    confidence: 'estimated',
    variancePercent: null,
    sources: { zillow: null, rentcast: null, calculated },
    displayNote: 'Estimated (0.7% rule) - No market data available',
    showWarning: true,
    showBothEstimates: false,
  };
}

/**
 * Get confidence color for UI display
 */
export function getConfidenceColor(confidence: RentConfidence): string {
  switch (confidence) {
    case 'high':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-orange-600';
    case 'estimated':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Get confidence background color for UI display
 */
export function getConfidenceBgColor(confidence: RentConfidence): string {
  switch (confidence) {
    case 'high':
      return 'bg-green-100';
    case 'medium':
      return 'bg-yellow-100';
    case 'low':
      return 'bg-orange-100';
    case 'estimated':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
}
