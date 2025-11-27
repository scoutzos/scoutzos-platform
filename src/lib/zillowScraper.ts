// src/lib/zillowScraper.ts
import { RawDealInput } from "./dealsIngest";

const RAPIDAPI_KEY = "065d734bc6mshbae103ca604ee3ep11a7b9jsnd2ff3a62e8bd";
const RAPIDAPI_HOST = "zillow-com1.p.rapidapi.com";
const BASE_URL = "https://zillow-com1.p.rapidapi.com";

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
};

export type ZillowSearchResponse = {
  totalResultCount: number;
  resultsPerPage: number;
  totalPages: number;
  props: ZillowProperty[];
};

/**
 * Search properties using the Zillow /propertyExtendedSearch endpoint
 */
export async function searchProperties(
  params: ZillowSearchParams
): Promise<ZillowSearchResponse> {
  const queryParams = new URLSearchParams();

  queryParams.append("location", params.location);

  if (params.status) queryParams.append("status_type", params.status);
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
  if (params.sort) queryParams.append("sort", params.sort);

  const url = `${BASE_URL}/propertyExtendedSearch?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zillow API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Transform the API response to our expected format
  const props: ZillowProperty[] = (data.props || []).map((prop: Record<string, unknown>) => ({
    zpid: prop.zpid,
    address: prop.address || prop.streetAddress || "",
    city: prop.city || "",
    state: prop.state || "",
    zipcode: prop.zipcode || "",
    price: prop.price || 0,
    bedrooms: prop.bedrooms || 0,
    bathrooms: prop.bathrooms || 0,
    livingArea: prop.livingArea || 0,
    lotAreaValue: prop.lotAreaValue || 0,
    lotAreaUnit: prop.lotAreaUnit || "sqft",
    homeType: prop.homeType || "",
    homeStatus: prop.homeStatus || "",
    daysOnZillow: prop.daysOnZillow || 0,
    rentZestimate: prop.rentZestimate || null,
    zestimate: prop.zestimate || null,
    imgSrc: prop.imgSrc || "",
    detailUrl: prop.detailUrl || `https://www.zillow.com/homedetails/${prop.zpid}_zpid/`,
    latitude: prop.latitude || 0,
    longitude: prop.longitude || 0,
  }));

  return {
    totalResultCount: data.totalResultCount || 0,
    resultsPerPage: data.resultsPerPage || 40,
    totalPages: data.totalPages || 1,
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
