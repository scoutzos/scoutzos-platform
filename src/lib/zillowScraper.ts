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

    // Extract photos from various possible locations - comprehensive multi-photo extraction
    let photos: string[] = [];

    // Try multiple possible photo array fields
    const photoArrayFields = ['photos', 'carouselPhotos', 'hugePhotos', 'images', 'responsivePhotos', 'photoGallery'];
    for (const field of photoArrayFields) {
      if (Array.isArray(prop[field]) && photos.length === 0) {
        const arr = prop[field] as unknown[];
        photos = arr.map((p: unknown): string => {
          if (typeof p === 'string') return p;
          const pObj = p as Record<string, unknown>;
          // Try various nested URL patterns
          return (pObj?.url || pObj?.href || pObj?.mixedSources?.jpeg?.[0]?.url ||
                  pObj?.hiResLink || pObj?.fullUrl || pObj?.webp || '') as string;
        }).filter(Boolean);
      }
    }

    // Try hdpData photo arrays
    if (photos.length === 0 && hdpData) {
      const hdpPhotos = (hdpData.homeInfo as Record<string, unknown>)?.photos || hdpData.photos;
      if (Array.isArray(hdpPhotos)) {
        photos = (hdpPhotos as unknown[]).map((p: unknown): string => {
          if (typeof p === 'string') return p;
          const pObj = p as Record<string, unknown>;
          return (pObj?.url || pObj?.href || pObj?.mixedSources?.jpeg?.[0]?.url || '') as string;
        }).filter(Boolean);
      }
    }

    // Try single image fields as fallback
    if (photos.length === 0) {
      const singleImageFields = ['imgSrc', 'image', 'hiResImageLink', 'thumbnailUrl', 'primaryPhoto'];
      for (const field of singleImageFields) {
        if (prop[field] && typeof prop[field] === 'string') {
          photos.push(prop[field] as string);
        } else if (prop[field] && typeof prop[field] === 'object') {
          const imgObj = prop[field] as Record<string, unknown>;
          const url = (imgObj?.url || imgObj?.href || imgObj?.mixedSources?.jpeg?.[0]?.url) as string;
          if (url) photos.push(url);
        }
      }
    }

    // Deduplicate photos
    photos = [...new Set(photos)];

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
 * Fetch detailed property info including year_built using zpid
 */
export async function getPropertyDetails(zpid: number): Promise<Partial<ZillowProperty> | null> {
  try {
    const url = `${BASE_URL}/property?zpid=${zpid}`;
    console.log("[Zillow API] Fetching property details for zpid:", zpid);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      console.warn(`[Zillow API] Property details failed for zpid ${zpid}:`, response.status);
      return null;
    }

    const data = await response.json();
    console.log("[Zillow API] Property details response keys:", Object.keys(data));

    // Extract year built from various possible locations
    const yearBuilt = data.yearBuilt || data.resoFacts?.yearBuilt || data.buildingYearBuilt || null;

    // Extract photos from property details
    let photos: string[] = [];
    const photoArrayFields = ['photos', 'responsivePhotos', 'photoGallery', 'hugePhotos'];
    for (const field of photoArrayFields) {
      if (Array.isArray(data[field]) && photos.length === 0) {
        photos = data[field].map((p: unknown): string => {
          if (typeof p === 'string') return p;
          const pObj = p as Record<string, unknown>;
          return (pObj?.url || pObj?.href || pObj?.mixedSources?.jpeg?.[0]?.url ||
                  pObj?.hiResLink || pObj?.fullUrl || '') as string;
        }).filter(Boolean);
      }
    }

    return {
      yearBuilt: yearBuilt as number | null,
      // Also grab any other useful details that might be missing from search
      bedrooms: data.bedrooms || data.resoFacts?.bedrooms,
      bathrooms: data.bathrooms || data.resoFacts?.bathrooms,
      livingArea: data.livingArea || data.resoFacts?.livingArea,
      lotAreaValue: data.lotSize || data.resoFacts?.lotSize,
      description: data.description,
      photos: photos.length > 0 ? photos : undefined,
    };
  } catch (error) {
    console.warn(`[Zillow API] Error fetching property details for zpid ${zpid}:`, error);
    return null;
  }
}

/**
 * Enrich properties with detailed info (including year_built)
 * This makes additional API calls so use sparingly
 */
export async function enrichPropertiesWithDetails(
  props: ZillowProperty[]
): Promise<ZillowProperty[]> {
  const enrichedProps: ZillowProperty[] = [];

  for (const prop of props) {
    // Enrich if missing yearBuilt OR if we only have 1 or no photos
    if (prop.zpid && (!prop.yearBuilt || prop.photos.length <= 1)) {
      const details = await getPropertyDetails(prop.zpid);
      if (details) {
        // Merge photos: prefer details photos if more, otherwise merge uniquely
        let mergedPhotos = prop.photos;
        if (details.photos && details.photos.length > 0) {
          if (details.photos.length > prop.photos.length) {
            mergedPhotos = details.photos;
          } else {
            // Merge and deduplicate
            mergedPhotos = [...new Set([...prop.photos, ...details.photos])];
          }
        }

        enrichedProps.push({
          ...prop,
          yearBuilt: details.yearBuilt ?? prop.yearBuilt,
          bedrooms: details.bedrooms ?? prop.bedrooms,
          bathrooms: details.bathrooms ?? prop.bathrooms,
          livingArea: details.livingArea ?? prop.livingArea,
          lotAreaValue: details.lotAreaValue ?? prop.lotAreaValue,
          description: details.description ?? prop.description,
          photos: mergedPhotos,
        });
        continue;
      }
    }
    enrichedProps.push(prop);
  }

  return enrichedProps;
}

/**
 * Convert a Zillow property to RawDealInput for database insertion
 */
export function zillowPropertyToDeal(prop: ZillowProperty): RawDealInput {
  // Store Zillow's rentZestimate separately
  const zillowRentEstimate = prop.rentZestimate;

  // Calculate fallback estimated rent using 0.7% rule if no Zillow estimate
  const calculatedRent = prop.price > 0 ? Math.round(prop.price * 0.007) : null;

  // Best estimate: Zillow > calculated (RentCast will be added during import)
  const bestEstimate = zillowRentEstimate ?? calculatedRent;

  return {
    address: prop.address,
    city: prop.city,
    state: prop.state,
    zipcode: prop.zipcode,
    list_price: prop.price,
    rent_estimate: bestEstimate,
    zillow_rent_estimate: zillowRentEstimate,
    url: prop.detailUrl,
    source: "zillow",
    source_url: prop.detailUrl,
    is_off_market: prop.homeStatus === "OFF_MARKET",
    status: prop.homeStatus === "FOR_SALE" ? "active" : prop.homeStatus.toLowerCase(),
    // Property details
    beds: prop.bedrooms || undefined,
    baths: prop.bathrooms || undefined,
    sqft: prop.livingArea || undefined,
    lot_size: prop.lotAreaValue || undefined,
    year_built: prop.yearBuilt,
    property_type: prop.homeType || undefined,
    days_on_market: prop.daysOnZillow || undefined,
    photos: prop.photos?.length > 0 ? prop.photos : undefined,
    latitude: prop.latitude || undefined,
    longitude: prop.longitude || undefined,
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
