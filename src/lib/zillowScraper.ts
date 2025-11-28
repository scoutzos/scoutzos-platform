// src/lib/zillowScraper.ts
import { RawDealInput } from "./dealsIngest";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "065d734bc6mshbae103ca604ee3ep11a7b9jsnd2ff3a62e8bd";
const RAPIDAPI_HOST = "zillow56.p.rapidapi.com";
const BASE_URL = "https://zillow56.p.rapidapi.com";

export type ZillowSearchParams = {
  location: string; // City, State (e.g., "Atlanta, GA")
  status?: "forSale" | "forRent" | "recentlySold";
  home_type?: string; // e.g., "Houses,Apartments"
  minPrice?: number;
  maxPrice?: number;
  bedsMin?: number;
  bedsMax?: number;
  bathsMin?: number;
  bathsMax?: number;
  sqftMin?: number;
  sqftMax?: number;
  page?: number;
  sort?: string;
};

export type ZillowProperty = {
  zpid: number;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  lotAreaValue: number;
  lotAreaUnit: string;
  homeType: string;
  homeStatus: string;
  daysOnZillow: number;
  rentZestimate: number | null;
  zestimate: number | null;
  imgSrc: string;
  detailUrl: string;
  latitude: number;
  longitude: number;
  // Additional fields for comprehensive deal data
  yearBuilt: number | null;
  photos: string[];
  description: string | null;
};

export type ZillowSearchResponse = {
  totalResultCount: number;
  resultsPerPage: number;
  totalPages: number;
  props: ZillowProperty[];
};

/**
 * Search properties using the Zillow56 /search endpoint
 */
export async function searchProperties(
  params: ZillowSearchParams
): Promise<ZillowSearchResponse> {
  const queryParams = new URLSearchParams();

  // Required parameters
  queryParams.append("location", params.location.toLowerCase());
  queryParams.append("output", "json");
  queryParams.append("status", params.status || "forSale");
  queryParams.append("sortSelection", params.sort || "priorityscore");
  queryParams.append("listing_type", "by_agent");
  queryParams.append("doz", "any");

  // Optional filters
  if (params.home_type) queryParams.append("home_type", params.home_type);
  if (params.minPrice) queryParams.append("minPrice", params.minPrice.toString());
  if (params.maxPrice) queryParams.append("maxPrice", params.maxPrice.toString());
  if (params.bedsMin) queryParams.append("bedsMin", params.bedsMin.toString());
  if (params.bedsMax) queryParams.append("bedsMax", params.bedsMax.toString());
  if (params.bathsMin) queryParams.append("bathsMin", params.bathsMin.toString());
  if (params.bathsMax) queryParams.append("bathsMax", params.bathsMax.toString());
  if (params.sqftMin) queryParams.append("sqftMin", params.sqftMin.toString());
  if (params.sqftMax) queryParams.append("sqftMax", params.sqftMax.toString());
  if (params.page) queryParams.append("page", params.page.toString());

  const url = `${BASE_URL}/search?${queryParams.toString()}`;

  console.log("[Zillow API] Requesting:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Zillow API] Error:", response.status, errorText);
    throw new Error(`Zillow API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  console.log("[Zillow API] Response keys:", Object.keys(data));

  // Handle the Zillow56 API response structure
  // The API returns results in data.results or data.props or as a direct array
  let rawProps: Record<string, unknown>[] = [];

  if (Array.isArray(data)) {
    rawProps = data;
  } else if (data.results && Array.isArray(data.results)) {
    rawProps = data.results;
  } else if (data.props && Array.isArray(data.props)) {
    rawProps = data.props;
  } else if (data.searchResults?.listResults) {
    rawProps = data.searchResults.listResults;
  } else if (data.cat1?.searchResults?.listResults) {
    rawProps = data.cat1.searchResults.listResults;
  }

  console.log("[Zillow API] Found", rawProps.length, "properties");

  // Log first property to see available fields
  if (rawProps.length > 0) {
    console.log("[Zillow API] Sample raw property:", JSON.stringify(rawProps[0], null, 2));
  }

  // Transform the API response to our expected format
  const props: ZillowProperty[] = rawProps.map((prop: Record<string, unknown>) => {
    // Handle nested address object
    const addressObj = prop.address as Record<string, unknown> | undefined;

    // Handle nested hdpData object (common in some API responses)
    const hdpData = prop.hdpData as Record<string, unknown> | undefined;
    const homeInfo = hdpData?.homeInfo as Record<string, unknown> | undefined;

    // Extract photos from various possible locations
    let photos: string[] = [];
    if (Array.isArray(prop.photos)) {
      photos = prop.photos.map((p: unknown) => typeof p === 'string' ? p : (p as Record<string, unknown>)?.url || (p as Record<string, unknown>)?.href || '').filter(Boolean);
    } else if (Array.isArray(prop.carouselPhotos)) {
      photos = (prop.carouselPhotos as Record<string, unknown>[]).map(p => (p.url || p.href || '') as string).filter(Boolean);
    } else if (prop.imgSrc) {
      photos = [prop.imgSrc as string];
    } else if (prop.image) {
      photos = [prop.image as string];
    }

    return {
      zpid: (prop.zpid || prop.id || prop.propertyId || homeInfo?.zpid || 0) as number,
      address: (prop.streetAddress || addressObj?.streetAddress || homeInfo?.streetAddress || "") as string,
      city: (prop.city || prop.addressCity || addressObj?.city || homeInfo?.city || "") as string,
      state: (prop.state || prop.addressState || addressObj?.state || homeInfo?.state || "") as string,
      zipcode: (prop.zipcode || prop.addressZipcode || addressObj?.zipcode || homeInfo?.zipcode || "") as string,
      price: (prop.price || prop.unformattedPrice || prop.listPrice || homeInfo?.price || 0) as number,
      bedrooms: (prop.bedrooms || prop.beds || homeInfo?.bedrooms || 0) as number,
      bathrooms: (prop.bathrooms || prop.baths || homeInfo?.bathrooms || 0) as number,
      livingArea: (prop.livingArea || prop.area || prop.livingAreaValue || prop.sqft || homeInfo?.livingArea || 0) as number,
      lotAreaValue: (prop.lotAreaValue || prop.lotSize || prop.lotAreaSqFt || homeInfo?.lotAreaValue || 0) as number,
      lotAreaUnit: (prop.lotAreaUnit || "sqft") as string,
      homeType: (prop.homeType || prop.propertyType || prop.homeTypeDimension || homeInfo?.homeType || "") as string,
      homeStatus: (prop.homeStatus || prop.statusType || prop.listingStatus || homeInfo?.homeStatus || "") as string,
      daysOnZillow: (prop.daysOnZillow || prop.timeOnZillow || homeInfo?.daysOnZillow || 0) as number,
      rentZestimate: (prop.rentZestimate || homeInfo?.rentZestimate || null) as number | null,
      zestimate: (prop.zestimate || homeInfo?.zestimate || null) as number | null,
      imgSrc: (prop.imgSrc || prop.image || prop.hiResImageLink || prop.thumbnailUrl || photos[0] || "") as string,
      detailUrl: (prop.detailUrl || prop.url || prop.hdpUrl || homeInfo?.hdpUrl || `https://www.zillow.com/homedetails/${prop.zpid || prop.id}_zpid/`) as string,
      latitude: (prop.latitude || (prop.latLong as Record<string, unknown>)?.latitude || homeInfo?.latitude || 0) as number,
      longitude: (prop.longitude || (prop.latLong as Record<string, unknown>)?.longitude || homeInfo?.longitude || 0) as number,
      // Additional fields
      yearBuilt: (prop.yearBuilt || prop.year_built || prop.yearBuiltRange || homeInfo?.yearBuilt || null) as number | null,
      photos: photos,
      description: (prop.description || prop.hdpDescription || homeInfo?.description || null) as string | null,
    };
  });

  const totalResults = (data.totalResultCount || data.totalPages * 40 || props.length) as number;

  return {
    totalResultCount: totalResults,
    resultsPerPage: (data.resultsPerPage || 40) as number,
    totalPages: (data.totalPages || Math.ceil(totalResults / 40) || 1) as number,
    props,
  };
}

/**
 * Search properties by city and state
 */
export async function searchByCity(
  city: string,
  state: string,
  options?: Omit<ZillowSearchParams, "location">
): Promise<ZillowSearchResponse> {
  const location = `${city}, ${state}`;
  return searchProperties({ location, ...options });
}

/**
 * Convert a Zillow property to RawDealInput for database insertion
 */
export function zillowPropertyToDeal(prop: ZillowProperty): RawDealInput {
  return {
    address: prop.address,
    city: prop.city,
    state: prop.state,
    list_price: prop.price,
    rent_estimate: prop.rentZestimate,
    url: prop.detailUrl,
    source: "zillow",
    source_url: prop.detailUrl,
    is_off_market: prop.homeStatus === "OFF_MARKET",
    status: prop.homeStatus === "FOR_SALE" ? "active" : prop.homeStatus.toLowerCase(),
  };
}

/**
 * Search and transform properties ready for database insertion
 */
export async function searchAndTransformProperties(
  params: ZillowSearchParams
): Promise<{ results: ZillowSearchResponse; deals: RawDealInput[] }> {
  const results = await searchProperties(params);
  const deals = results.props.map(zillowPropertyToDeal);
  return { results, deals };
}
