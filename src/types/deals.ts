export type DealStatus = 'new' | 'analyzing' | 'saved' | 'offered' | 'under_contract' | 'closed' | 'passed' | 'dead';

export type RentConfidence = 'high' | 'medium' | 'low' | 'estimated';

export interface Deal {
    id: string;
    tenant_id: string;
    source: string;
    source_id?: string;
    source_url?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    zip: string;
    county?: string;
    property_type?: string;
    beds?: number;
    baths?: number;
    sqft?: number;
    lot_size?: number;
    year_built?: number;
    list_price: number;
    original_list_price?: number;
    price_reduced?: boolean;
    days_on_market?: number;
    photos: string[]; // JSONB in DB, parsed to array
    description?: string;
    listing_agent_name?: string;
    listing_agent_phone?: string;
    listing_agent_email?: string;
    listing_brokerage?: string;
    hoa_monthly?: number;
    tax_annual?: number;
    insurance_annual?: number;
    estimated_rent?: number;
    zillow_rent_estimate?: number;
    rentcast_rent_estimate?: number;
    rent_confidence?: RentConfidence;
    rent_variance_percent?: number;
    latitude?: number;
    longitude?: number;
    status: DealStatus;
    scraped_at?: string;
    last_updated_at?: string;
    updated_at?: string;
    created_at: string;
}
