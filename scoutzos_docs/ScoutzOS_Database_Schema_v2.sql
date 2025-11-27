-- ============================================================
-- SCOUTZOS DATABASE SCHEMA v2.0
-- Updated based on final scope agreement
-- Target: Supabase (PostgreSQL)
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SECTION 1: CORE TABLES
-- ============================================================

-- Multi-tenancy table (each PM company/owner is a tenant)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    white_label_config JSONB DEFAULT '{}',  -- Logo, colors, domain
    subscription_tier TEXT NOT NULL DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'growth', 'pro', 'scale', 'enterprise')),
    subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (linked to Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'pm', 'agent', 'accountant', 'viewer')),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL,
    county TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    property_type TEXT NOT NULL CHECK (property_type IN ('sfr', 'duplex', 'triplex', 'quadplex', 'multifamily', 'condo', 'townhouse', 'mobile')),
    beds INTEGER,
    baths NUMERIC(3, 1),
    sqft INTEGER,
    lot_size NUMERIC(10, 2),  -- acres
    year_built INTEGER,
    stories INTEGER DEFAULT 1,
    garage_spaces INTEGER DEFAULT 0,
    pool BOOLEAN DEFAULT FALSE,
    purchase_price NUMERIC(12, 2),
    purchase_date DATE,
    current_value NUMERIC(12, 2),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'vacant', 'listed', 'under_contract', 'sold', 'inactive')),
    management_mode TEXT NOT NULL DEFAULT 'self_manage' CHECK (management_mode IN ('self_manage', 'managed')),
    management_tier TEXT CHECK (management_tier IN ('essentials', 'standard', 'premium')),
    photos JSONB DEFAULT '[]',
    features JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_properties_tenant_id ON properties(tenant_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city_state ON properties(city, state);

-- Units (for multi-unit properties)
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    beds INTEGER,
    baths NUMERIC(3, 1),
    sqft INTEGER,
    floor INTEGER,
    market_rent NUMERIC(10, 2),
    status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant', 'listed', 'unavailable', 'make_ready')),
    features JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(property_id, unit_number)
);

CREATE INDEX idx_units_property_id ON units(property_id);
CREATE INDEX idx_units_status ON units(status);

-- ============================================================
-- SECTION 2: TENANT MANAGEMENT
-- ============================================================

-- Tenant profiles (renters, not to be confused with multi-tenancy "tenants")
CREATE TABLE tenant_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    ssn_encrypted TEXT,  -- Encrypted
    ssn_last4 TEXT,
    drivers_license TEXT,
    credit_score INTEGER,
    income_monthly NUMERIC(12, 2),
    income_verified BOOLEAN DEFAULT FALSE,
    employer TEXT,
    employer_phone TEXT,
    employment_start_date DATE,
    previous_address TEXT,
    previous_landlord_name TEXT,
    previous_landlord_phone TEXT,
    move_in_reason TEXT,
    pets JSONB DEFAULT '[]',
    vehicles JSONB DEFAULT '[]',
    emergency_contact JSONB,
    portal_user_id UUID REFERENCES auth.users(id),
    satisfaction_score NUMERIC(3, 1),  -- 1-100
    tags JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_profiles_tenant_id ON tenant_profiles(tenant_id);
CREATE INDEX idx_tenant_profiles_email ON tenant_profiles(email);

-- Co-tenants (additional people on a lease)
CREATE TABLE co_tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_tenant_id UUID NOT NULL REFERENCES tenant_profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    relationship TEXT,  -- spouse, roommate, child, etc.
    is_on_lease BOOLEAN DEFAULT TRUE,
    date_of_birth DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 3: LEASES
-- ============================================================

CREATE TABLE leases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    tenant_profile_id UUID NOT NULL REFERENCES tenant_profiles(id) ON DELETE CASCADE,
    lease_type TEXT NOT NULL CHECK (lease_type IN ('fixed', 'month_to_month')),
    start_date DATE NOT NULL,
    end_date DATE,  -- NULL for month-to-month
    rent_amount NUMERIC(10, 2) NOT NULL,
    rent_due_day INTEGER DEFAULT 1,
    security_deposit NUMERIC(10, 2),
    pet_deposit NUMERIC(10, 2),
    other_deposits JSONB DEFAULT '{}',
    late_fee_type TEXT CHECK (late_fee_type IN ('flat', 'percentage', 'daily')),
    late_fee_amount NUMERIC(10, 2),
    late_fee_grace_days INTEGER DEFAULT 5,
    utilities_included JSONB DEFAULT '[]',
    parking_spaces INTEGER DEFAULT 0,
    storage_included BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'active', 'expired', 'terminated', 'renewed')),
    signed_date DATE,
    move_in_date DATE,
    move_out_date DATE,
    termination_reason TEXT,
    termination_date DATE,
    notice_given_date DATE,
    document_url TEXT,
    signature_request_id TEXT,  -- HelloSign/DocuSign ID
    custom_clauses JSONB DEFAULT '[]',
    ai_compliance_check JSONB,
    addenda JSONB DEFAULT '[]',
    renewal_offered BOOLEAN DEFAULT FALSE,
    renewal_offer_date DATE,
    renewal_offer_terms JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX idx_leases_property_id ON leases(property_id);
CREATE INDEX idx_leases_tenant_profile_id ON leases(tenant_profile_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_leases_end_date ON leases(end_date);

-- ============================================================
-- SECTION 4: FINANCIAL
-- ============================================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
    tenant_profile_id UUID REFERENCES tenant_profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    category TEXT NOT NULL,  -- rent, late_fee, security_deposit, repair, insurance, etc.
    subcategory TEXT,
    amount NUMERIC(12, 2) NOT NULL,  -- Positive for income, negative for expense
    description TEXT,
    transaction_date DATE NOT NULL,
    payment_method TEXT,  -- ach, card, cash, check, wips
    stripe_payment_id TEXT,
    stripe_payout_id TEXT,
    vendor_id UUID,  -- References vendors table
    work_order_id UUID,  -- References work_orders table
    bank_account_id UUID,
    reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMPTZ,
    tax_category TEXT,  -- Schedule E category
    is_capital_expense BOOLEAN DEFAULT FALSE,
    receipt_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_tenant_id ON transactions(tenant_id);
CREATE INDEX idx_transactions_property_id ON transactions(property_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category);

-- Owner contributions (owner funding repairs/improvements)
CREATE TABLE owner_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(12, 2) NOT NULL,
    purpose TEXT,
    transaction_id UUID REFERENCES transactions(id),
    stripe_payment_id TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owner disbursements
CREATE TABLE owner_disbursements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(12, 2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'processing', 'completed', 'failed')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    stripe_transfer_id TEXT,
    stripe_payout_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 5: MAINTENANCE
-- ============================================================

CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    tenant_profile_id UUID REFERENCES tenant_profiles(id),  -- Reporting tenant
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,  -- plumbing, electrical, hvac, appliance, structural, pest, landscaping, cleaning, other
    subcategory TEXT,
    priority TEXT NOT NULL DEFAULT 'routine' CHECK (priority IN ('emergency', 'urgent', 'routine', 'preventive')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'assigned', 'scheduled', 'in_progress', 'pending_approval', 'completed', 'canceled')),
    source TEXT DEFAULT 'tenant' CHECK (source IN ('tenant', 'owner', 'pm', 'ai', 'preventive', 'inspection')),
    ai_triage JSONB,  -- AI classification results
    photos JSONB DEFAULT '[]',
    videos JSONB DEFAULT '[]',
    location_in_unit TEXT,
    access_instructions TEXT,
    tenant_available_times JSONB,
    estimated_cost NUMERIC(10, 2),
    actual_cost NUMERIC(10, 2),
    vendor_id UUID,  -- References vendors
    assigned_at TIMESTAMPTZ,
    scheduled_date DATE,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    completion_photos JSONB DEFAULT '[]',
    completion_notes TEXT,
    owner_approved BOOLEAN,
    owner_approved_at TIMESTAMPTZ,
    owner_approved_by UUID REFERENCES users(id),
    warranty_claim BOOLEAN DEFAULT FALSE,
    warranty_claim_status TEXT,
    invoice_id UUID,
    tenant_rating INTEGER,  -- 1-5 rating from tenant
    tenant_feedback TEXT,
    internal_notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_orders_tenant_id ON work_orders(tenant_id);
CREATE INDEX idx_work_orders_property_id ON work_orders(property_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_priority ON work_orders(priority);

-- Vendors
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = global vendor
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    categories JSONB NOT NULL DEFAULT '[]',  -- plumbing, electrical, hvac, etc.
    service_areas JSONB NOT NULL DEFAULT '[]',  -- zip codes or cities
    license_number TEXT,
    license_state TEXT,
    license_verified BOOLEAN DEFAULT FALSE,
    license_expiry DATE,
    insurance_carrier TEXT,
    insurance_policy_number TEXT,
    insurance_verified BOOLEAN DEFAULT FALSE,
    insurance_expiry DATE,
    insurance_document_url TEXT,
    w9_on_file BOOLEAN DEFAULT FALSE,
    w9_document_url TEXT,
    ein TEXT,
    hourly_rate NUMERIC(10, 2),
    emergency_available BOOLEAN DEFAULT FALSE,
    emergency_rate_multiplier NUMERIC(3, 2) DEFAULT 1.5,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'suspended', 'preferred', 'inactive')),
    reliability_score NUMERIC(5, 2),  -- 0-100
    quality_score NUMERIC(5, 2),  -- 0-100
    price_score NUMERIC(5, 2),  -- 0-100
    response_time_avg_hours NUMERIC(6, 2),
    jobs_completed INTEGER DEFAULT 0,
    jobs_on_time INTEGER DEFAULT 0,
    total_revenue NUMERIC(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendors_tenant_id ON vendors(tenant_id);
CREATE INDEX idx_vendors_status ON vendors(status);

-- Vendor bids
CREATE TABLE vendor_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    bid_amount NUMERIC(10, 2) NOT NULL,
    estimated_hours NUMERIC(5, 2),
    materials_cost NUMERIC(10, 2),
    labor_cost NUMERIC(10, 2),
    available_date DATE,
    available_time_start TIME,
    available_time_end TIME,
    completion_estimate_days INTEGER,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected', 'withdrawn', 'expired')),
    ai_score NUMERIC(5, 2),  -- AI ranking
    ai_ranking INTEGER,  -- 1st, 2nd, 3rd
    ai_recommendation TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 6: CRM & LEADS
-- ============================================================

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_type TEXT NOT NULL CHECK (lead_type IN ('tenant', 'owner', 'buyer', 'seller', 'mortgage', 'vendor')),
    source TEXT,  -- zillow, facebook, website, referral, etc.
    source_url TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    property_id UUID REFERENCES properties(id),
    unit_id UUID REFERENCES units(id),
    interested_in JSONB,  -- What they're looking for
    pipeline_stage TEXT NOT NULL DEFAULT 'new',
    ai_qualification_score NUMERIC(5, 2),  -- 0-100
    ai_qualification_reasons JSONB,
    assigned_to UUID REFERENCES users(id),
    last_contact_at TIMESTAMPTZ,
    last_contact_method TEXT,
    next_action TEXT,
    next_action_date TIMESTAMPTZ,
    move_in_date DATE,
    budget_min NUMERIC(10, 2),
    budget_max NUMERIC(10, 2),
    beds_wanted INTEGER,
    baths_wanted NUMERIC(3, 1),
    pets JSONB,
    notes TEXT,
    tags JSONB DEFAULT '[]',
    is_qualified BOOLEAN,
    qualified_at TIMESTAMPTZ,
    converted_to UUID,  -- tenant_profile_id or other
    converted_at TIMESTAMPTZ,
    lost_reason TEXT,
    lost_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX idx_leads_type ON leads(lead_type);
CREATE INDEX idx_leads_stage ON leads(pipeline_stage);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);

-- Conversations (unified inbox)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    tenant_profile_id UUID REFERENCES tenant_profiles(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'phone', 'chat', 'portal', 'voicemail')),
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    from_address TEXT,
    to_address TEXT,
    subject TEXT,
    body TEXT NOT NULL,
    html_body TEXT,
    is_ai_response BOOLEAN DEFAULT FALSE,
    ai_model_used TEXT,
    ai_prompt_id TEXT,
    ai_sentiment TEXT,  -- positive, neutral, negative, urgent
    ai_intent TEXT,  -- inquiry, complaint, request, etc.
    ai_suggested_response TEXT,
    attachments JSONB DEFAULT '[]',
    call_duration_seconds INTEGER,
    call_recording_url TEXT,
    call_transcription TEXT,
    voicemail_url TEXT,
    voicemail_transcription TEXT,
    read_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    twilio_sid TEXT,
    sendgrid_id TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_tenant_id ON conversations(tenant_id);
CREATE INDEX idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX idx_conversations_tenant_profile_id ON conversations(tenant_profile_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- Showings
CREATE TABLE showings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id),
    showing_type TEXT NOT NULL CHECK (showing_type IN ('in_person', 'virtual', 'self_guided')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'no_show', 'canceled', 'rescheduled')),
    agent_id UUID REFERENCES users(id),
    smart_lock_code TEXT,
    smart_lock_code_expires TIMESTAMPTZ,
    access_instructions TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    notes TEXT,
    feedback JSONB,  -- Post-showing feedback
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 7: DEALS & INVESTMENTS
-- ============================================================

CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source TEXT NOT NULL,  -- mls, zillow, auction, wholesaler, investorlift, manual, etc.
    source_id TEXT,  -- External ID from source
    source_url TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL,
    county TEXT,
    property_type TEXT,
    beds INTEGER,
    baths NUMERIC(3, 1),
    sqft INTEGER,
    lot_size NUMERIC(10, 2),
    year_built INTEGER,
    list_price NUMERIC(12, 2) NOT NULL,
    original_list_price NUMERIC(12, 2),
    price_reduced BOOLEAN DEFAULT FALSE,
    days_on_market INTEGER,
    photos JSONB DEFAULT '[]',
    description TEXT,
    listing_agent_name TEXT,
    listing_agent_phone TEXT,
    listing_agent_email TEXT,
    listing_brokerage TEXT,
    hoa_monthly NUMERIC(10, 2),
    tax_annual NUMERIC(10, 2),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'analyzing', 'saved', 'offered', 'under_contract', 'closed', 'passed', 'dead')),
    scraped_at TIMESTAMPTZ,
    last_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deals_tenant_id ON deals(tenant_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_city_state ON deals(city, state);
CREATE INDEX idx_deals_list_price ON deals(list_price);

-- Deal analyses
CREATE TABLE deal_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    analysis_name TEXT,
    purchase_price NUMERIC(12, 2) NOT NULL,
    closing_costs NUMERIC(12, 2),
    rehab_estimate NUMERIC(12, 2),
    arv NUMERIC(12, 2),  -- After repair value
    rent_estimate NUMERIC(10, 2) NOT NULL,
    rent_confidence NUMERIC(5, 2),
    rent_comps JSONB,
    expenses JSONB NOT NULL,  -- Itemized: taxes, insurance, hoa, vacancy, repairs, capex, mgmt
    total_monthly_expenses NUMERIC(10, 2),
    noi NUMERIC(10, 2),  -- Net operating income
    down_payment_pct NUMERIC(5, 2),
    down_payment_amount NUMERIC(12, 2),
    loan_amount NUMERIC(12, 2),
    interest_rate NUMERIC(5, 3),
    loan_term_years INTEGER,
    monthly_piti NUMERIC(10, 2),
    monthly_cashflow NUMERIC(10, 2),
    annual_cashflow NUMERIC(12, 2),
    cap_rate NUMERIC(5, 2),
    cash_on_cash NUMERIC(5, 2),
    dscr NUMERIC(5, 2),
    irr_5yr NUMERIC(5, 2),
    irr_10yr NUMERIC(5, 2),
    total_roi_5yr NUMERIC(5, 2),
    equity_5yr NUMERIC(12, 2),
    break_even_occupancy NUMERIC(5, 2),
    ai_summary TEXT,
    ai_strengths JSONB,
    ai_risks JSONB,
    ai_recommendation TEXT,  -- buy, negotiate, pass
    ai_negotiation_target NUMERIC(12, 2),
    ai_confidence NUMERIC(5, 2),
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_analyses_deal_id ON deal_analyses(deal_id);
CREATE INDEX idx_deal_analyses_user_id ON deal_analyses(user_id);

-- Buy boxes
CREATE TABLE buy_boxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    markets JSONB NOT NULL DEFAULT '[]',  -- Cities, states, or zip codes
    property_types JSONB DEFAULT '[]',
    min_price NUMERIC(12, 2),
    max_price NUMERIC(12, 2),
    min_beds INTEGER,
    max_beds INTEGER,
    min_baths NUMERIC(3, 1),
    max_baths NUMERIC(3, 1),
    min_sqft INTEGER,
    max_sqft INTEGER,
    min_year_built INTEGER,
    max_year_built INTEGER,
    strategy TEXT,  -- brrrr, buy_hold, flip, str, house_hack
    target_cap_rate NUMERIC(5, 2),
    target_cash_on_cash NUMERIC(5, 2),
    min_dscr NUMERIC(5, 2),
    max_rehab NUMERIC(12, 2),
    exclude_hoa BOOLEAN DEFAULT FALSE,
    max_hoa NUMERIC(10, 2),
    alert_frequency TEXT DEFAULT 'daily',  -- realtime, daily, weekly
    is_active BOOLEAN DEFAULT TRUE,
    last_matched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deal matches (for swipe interface)
CREATE TABLE deal_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    buy_box_id UUID NOT NULL REFERENCES buy_boxes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    match_score NUMERIC(5, 2) NOT NULL,
    match_reasons JSONB,
    user_action TEXT,  -- liked, passed, saved, offered
    swiped_at TIMESTAMPTZ,
    alert_sent BOOLEAN DEFAULT FALSE,
    alert_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(deal_id, user_id)
);

-- Investor partnerships
CREATE TABLE investor_partnerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id),
    property_id UUID REFERENCES properties(id),
    lead_investor_id UUID NOT NULL REFERENCES users(id),
    partner_investor_id UUID NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'interested', 'committed', 'active', 'declined', 'exited')),
    equity_share_pct NUMERIC(5, 2),
    capital_committed NUMERIC(12, 2),
    capital_contributed NUMERIC(12, 2),
    preferred_return_pct NUMERIC(5, 2),
    profit_split_pct NUMERIC(5, 2),
    notes TEXT,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 8: LENDING
-- ============================================================

CREATE TABLE loan_prequals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    deal_id UUID REFERENCES deals(id),
    property_id UUID REFERENCES properties(id),
    loan_purpose TEXT NOT NULL CHECK (loan_purpose IN ('purchase', 'refinance', 'cashout', 'heloc')),
    loan_type TEXT NOT NULL,  -- dscr, conventional, fha, va, heloc, hard_money
    requested_amount NUMERIC(12, 2) NOT NULL,
    property_value NUMERIC(12, 2),
    property_type TEXT,
    property_use TEXT,  -- investment, primary, second_home
    credit_score INTEGER,
    credit_score_verified BOOLEAN DEFAULT FALSE,
    income_monthly NUMERIC(12, 2),
    income_verified BOOLEAN DEFAULT FALSE,
    employment_status TEXT,
    employer_name TEXT,
    employment_years INTEGER,
    assets_liquid NUMERIC(12, 2),
    assets_verified BOOLEAN DEFAULT FALSE,
    debts_monthly NUMERIC(12, 2),
    dti NUMERIC(5, 2),
    existing_mortgages INTEGER,
    bankruptcy_history BOOLEAN,
    foreclosure_history BOOLEAN,
    experience_properties INTEGER,  -- How many properties they own/have owned
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewing', 'prequal_issued', 'declined', 'sent_to_brokerage', 'in_process', 'closed')),
    prequal_amount NUMERIC(12, 2),
    prequal_rate NUMERIC(5, 3),
    prequal_expires DATE,
    ai_recommendation JSONB,
    ai_suggested_products JSONB,
    brokerage_handoff_at TIMESTAMPTZ,
    brokerage_contact JSONB,
    brokerage_notes TEXT,
    documents JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 9: DOCUMENTS
-- ============================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id),
    unit_id UUID REFERENCES units(id),
    lease_id UUID REFERENCES leases(id),
    tenant_profile_id UUID REFERENCES tenant_profiles(id),
    work_order_id UUID REFERENCES work_orders(id),
    loan_prequal_id UUID REFERENCES loan_prequals(id),
    category TEXT NOT NULL,  -- lease, insurance, deed, tax, inspection, warranty, w9, 1099, other
    subcategory TEXT,
    name TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT,  -- pdf, jpg, png, docx
    file_size INTEGER,  -- bytes
    ai_parsed BOOLEAN DEFAULT FALSE,
    ai_parsed_data JSONB,
    ai_parsed_at TIMESTAMPTZ,
    expires_at DATE,
    requires_renewal BOOLEAN DEFAULT FALSE,
    renewal_reminder_days INTEGER,
    is_signed BOOLEAN DEFAULT FALSE,
    signature_request_id TEXT,
    signed_at TIMESTAMPTZ,
    signed_by JSONB,
    uploaded_by UUID REFERENCES users(id),
    tags JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_documents_property_id ON documents(property_id);
CREATE INDEX idx_documents_category ON documents(category);

-- ============================================================
-- SECTION 10: PROPERTY 360 INTELLIGENCE
-- ============================================================

CREATE TABLE property_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE UNIQUE,
    
    -- Location scores
    walk_score INTEGER,
    transit_score INTEGER,
    bike_score INTEGER,
    
    -- Schools
    school_data JSONB,  -- Nearby schools with ratings
    school_district TEXT,
    
    -- Crime
    crime_grade TEXT,  -- A, B, C, D, F
    crime_data JSONB,
    
    -- Demographics
    demographics JSONB,
    median_household_income NUMERIC(12, 2),
    population_density NUMERIC(10, 2),
    
    -- Environment
    flood_zone TEXT,
    flood_zone_description TEXT,
    environmental_hazards JSONB,
    
    -- Zoning
    zoning TEXT,
    zoning_description TEXT,
    allowed_uses JSONB,
    
    -- Development
    nearby_permits JSONB,
    development_pipeline JSONB,
    
    -- Market
    rent_comps JSONB,
    sale_comps JSONB,
    median_rent NUMERIC(10, 2),
    median_sale_price NUMERIC(12, 2),
    days_on_market_avg INTEGER,
    absorption_rate NUMERIC(5, 2),
    vacancy_rate NUMERIC(5, 2),
    appreciation_1yr NUMERIC(5, 2),
    appreciation_3yr NUMERIC(5, 2),
    appreciation_5yr NUMERIC(5, 2),
    rent_growth_1yr NUMERIC(5, 2),
    cap_rate_market NUMERIC(5, 2),
    
    -- Compliance
    rent_control BOOLEAN DEFAULT FALSE,
    rent_control_details JSONB,
    str_allowed BOOLEAN,
    str_permit_required BOOLEAN,
    str_regulations JSONB,
    section_8_eligible BOOLEAN,
    lead_paint_disclosure_required BOOLEAN,
    
    -- Last updated
    walk_score_updated_at TIMESTAMPTZ,
    schools_updated_at TIMESTAMPTZ,
    crime_updated_at TIMESTAMPTZ,
    demographics_updated_at TIMESTAMPTZ,
    market_updated_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property loans
CREATE TABLE property_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    lender_name TEXT,
    loan_type TEXT,  -- conventional, fha, va, dscr, heloc, hard_money
    original_amount NUMERIC(12, 2) NOT NULL,
    current_balance NUMERIC(12, 2),
    interest_rate NUMERIC(5, 3),
    is_arm BOOLEAN DEFAULT FALSE,
    arm_index TEXT,
    arm_margin NUMERIC(5, 3),
    arm_reset_date DATE,
    monthly_payment NUMERIC(10, 2),
    principal_portion NUMERIC(10, 2),
    interest_portion NUMERIC(10, 2),
    escrow_amount NUMERIC(10, 2),
    origination_date DATE,
    first_payment_date DATE,
    maturity_date DATE,
    prepayment_penalty BOOLEAN DEFAULT FALSE,
    prepayment_penalty_expires DATE,
    loan_servicer TEXT,
    loan_servicer_phone TEXT,
    account_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refinance opportunities
CREATE TABLE refi_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    property_loan_id UUID REFERENCES property_loans(id),
    opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('rate_reduction', 'cash_out', 'term_change', 'arm_reset', 'heloc')),
    current_rate NUMERIC(5, 3),
    current_balance NUMERIC(12, 2),
    current_payment NUMERIC(10, 2),
    current_equity NUMERIC(12, 2),
    current_ltv NUMERIC(5, 2),
    market_rate NUMERIC(5, 3),
    estimated_new_rate NUMERIC(5, 3),
    estimated_new_balance NUMERIC(12, 2),
    estimated_new_payment NUMERIC(10, 2),
    monthly_savings NUMERIC(10, 2),
    lifetime_savings NUMERIC(12, 2),
    break_even_months INTEGER,
    cash_out_available_80ltv NUMERIC(12, 2),
    cash_out_available_75ltv NUMERIC(12, 2),
    estimated_closing_costs NUMERIC(10, 2),
    ai_recommendation TEXT,
    ai_reasoning TEXT,
    confidence_score NUMERIC(5, 2),
    status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'presented', 'interested', 'applied', 'closed', 'declined', 'expired')),
    presented_at TIMESTAMPTZ,
    user_response TEXT,
    user_response_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 11: AUTOMATION & AI
-- ============================================================

-- Automation rules
CREATE TABLE automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL,  -- lease_expiring, rent_late, maintenance_new, lead_new, etc.
    trigger_config JSONB NOT NULL,  -- Conditions
    action_type TEXT NOT NULL,  -- send_email, send_sms, create_task, assign_to, etc.
    action_config JSONB NOT NULL,  -- Action parameters
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation logs
CREATE TABLE automation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    trigger_data JSONB,
    action_result JSONB,
    success BOOLEAN,
    error_message TEXT
);

-- AI conversation logs (for training and debugging)
CREATE TABLE ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    feature TEXT NOT NULL,  -- deal_analysis, tenant_chat, maintenance_triage, etc.
    model TEXT NOT NULL,  -- gpt-4, gpt-3.5-turbo
    prompt_template TEXT,
    input_data JSONB,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    response_time_ms INTEGER,
    response JSONB,
    rating INTEGER,  -- User rating 1-5
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_logs_tenant_id ON ai_logs(tenant_id);
CREATE INDEX idx_ai_logs_feature ON ai_logs(feature);
CREATE INDEX idx_ai_logs_created_at ON ai_logs(created_at);

-- ============================================================
-- SECTION 12: ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE buy_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT tenant_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example RLS policies (apply to all tenant-scoped tables)
CREATE POLICY "Users can view their tenant data" ON properties
    FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert to their tenant" ON properties
    FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update their tenant data" ON properties
    FOR UPDATE USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete their tenant data" ON properties
    FOR DELETE USING (tenant_id = get_user_tenant_id());

-- Repeat similar policies for all tenant-scoped tables...

-- ============================================================
-- SECTION 13: FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_leases_updated_at BEFORE UPDATE ON leases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_deal_analyses_updated_at BEFORE UPDATE ON deal_analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_buy_boxes_updated_at BEFORE UPDATE ON buy_boxes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON SCHEMA public IS 'ScoutzOS Database Schema v2.0 - AI-Powered Real Estate Operating System';
