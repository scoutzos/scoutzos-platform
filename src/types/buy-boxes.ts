export interface BuyBox {
    id: string;
    tenant_id: string;
    user_id: string;
    name: string;
    markets: string[]; // JSONB in DB
    property_types: string[]; // JSONB in DB
    min_price?: number;
    max_price?: number;
    min_beds?: number;
    max_beds?: number;
    min_baths?: number;
    max_baths?: number;
    min_sqft?: number;
    max_sqft?: number;
    min_year_built?: number;
    max_year_built?: number;
    strategy?: string;
    target_cap_rate?: number;
    target_cash_on_cash?: number;
    min_dscr?: number;
    max_rehab?: number;
    exclude_hoa?: boolean;
    max_hoa?: number;
    alert_frequency?: 'realtime' | 'daily' | 'weekly';
    is_active?: boolean;
    last_matched_at?: string;
    created_at: string;
    updated_at: string;
}
