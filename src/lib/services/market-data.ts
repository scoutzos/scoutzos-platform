import { getRentEstimate, mapPropertyType, type RentEstimateResponse } from '@/lib/rentCast';

export interface MarketData {
    rent_estimate: RentEstimateResponse | null;
    comparables: any[];
    last_updated: string;
}

/**
 * Service to fetch real-time market data for a property
 * Currently aggregates RentCast data, but designed to be extensible
 */
export async function getMarketData(property: {
    address: string;
    city: string;
    state: string;
    zip: string;
    beds: number;
    baths: number;
    sqft: number;
    property_type: string;
}): Promise<MarketData> {

    // Fetch RentCast data
    // We map the property type string to the RentCast enum inside getRentEstimate if needed,
    // but here we pass the raw string and let the utility handle it or we map it here.
    // Looking at rentCast.ts, getRentEstimate takes a specific type.
    // We should map it here or let the utility do it.
    // The utility has mapPropertyType exported.

    const rentData = await getRentEstimate({
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zip,
        bedrooms: property.beds,
        bathrooms: property.baths,
        squareFootage: property.sqft,
        propertyType: property.property_type ? mapPropertyType(property.property_type) : undefined,
    });

    return {
        rent_estimate: rentData,
        comparables: rentData?.comparables || [],
        last_updated: new Date().toISOString()
    };
}
