// ============================================================
// SCOUTZOS PHASE 2 TYPESCRIPT TYPES
// Generated: November 29, 2025
// ============================================================

// ============================================================
// PROPERTIES
// ============================================================

export type PropertyType = 'sfr' | 'duplex' | 'triplex' | 'quadplex' | 'multifamily' | 'condo' | 'townhouse' | 'mobile';
export type PropertyStatus = 'active' | 'vacant' | 'listed' | 'under_contract' | 'sold' | 'inactive';
export type ManagementMode = 'self_manage' | 'managed';
export type ManagementTier = 'essentials' | 'standard' | 'premium';

export interface Property {
  id: string;
  tenant_id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  property_type: PropertyType;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lot_size: number | null;
  year_built: number | null;
  stories: number;
  garage_spaces: number;
  pool: boolean;
  purchase_price: number | null;
  purchase_date: string | null;
  current_value: number | null;
  status: PropertyStatus;
  management_mode: ManagementMode;
  management_tier: ManagementTier | null;
  photos: string[];
  features: Record<string, any>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyInput {
  tenant_id: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  zip: string;
  county?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  property_type: PropertyType;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  lot_size?: number | null;
  year_built?: number | null;
  stories?: number;
  garage_spaces?: number;
  pool?: boolean;
  purchase_price?: number | null;
  purchase_date?: string | null;
  current_value?: number | null;
  status?: PropertyStatus;
  management_mode?: ManagementMode;
  management_tier?: ManagementTier | null;
  photos?: string[];
  features?: Record<string, any>;
  notes?: string | null;
}

// ============================================================
// UNITS
// ============================================================

export type UnitStatus = 'occupied' | 'vacant' | 'listed' | 'unavailable' | 'make_ready';

export interface Unit {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_number: string;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  floor: number | null;
  market_rent: number | null;
  status: UnitStatus;
  features: Record<string, any>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnitInput {
  tenant_id: string;
  property_id: string;
  unit_number: string;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  floor?: number | null;
  market_rent?: number | null;
  status?: UnitStatus;
  features?: Record<string, any>;
  notes?: string | null;
}

// ============================================================
// TENANT PROFILES (Renters)
// ============================================================

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface Pet {
  type: string;
  breed: string;
  weight: number;
  name: string;
}

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  state: string;
}

export interface TenantProfile {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  ssn_encrypted: string | null;
  ssn_last4: string | null;
  drivers_license: string | null;
  credit_score: number | null;
  income_monthly: number | null;
  income_verified: boolean;
  employer: string | null;
  employer_phone: string | null;
  employment_start_date: string | null;
  previous_address: string | null;
  previous_landlord_name: string | null;
  previous_landlord_phone: string | null;
  move_in_reason: string | null;
  pets: Pet[];
  vehicles: Vehicle[];
  emergency_contact: EmergencyContact | null;
  portal_user_id: string | null;
  satisfaction_score: number | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantProfileInput {
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string | null;
  ssn_last4?: string | null;
  drivers_license?: string | null;
  credit_score?: number | null;
  income_monthly?: number | null;
  income_verified?: boolean;
  employer?: string | null;
  employer_phone?: string | null;
  employment_start_date?: string | null;
  previous_address?: string | null;
  previous_landlord_name?: string | null;
  previous_landlord_phone?: string | null;
  move_in_reason?: string | null;
  pets?: Pet[];
  vehicles?: Vehicle[];
  emergency_contact?: EmergencyContact | null;
  tags?: string[];
  notes?: string | null;
}

// ============================================================
// CO-TENANTS
// ============================================================

export interface CoTenant {
  id: string;
  primary_tenant_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  is_on_lease: boolean;
  date_of_birth: string | null;
  created_at: string;
}

export interface CoTenantInput {
  primary_tenant_id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  relationship?: string | null;
  is_on_lease?: boolean;
  date_of_birth?: string | null;
}

// ============================================================
// LEASES
// ============================================================

export type LeaseType = 'fixed' | 'month_to_month';
export type LeaseStatus = 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated' | 'renewed';
export type LateFeeType = 'flat' | 'percentage' | 'daily';

export interface Lease {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id: string | null;
  tenant_profile_id: string;
  lease_type: LeaseType;
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  rent_due_day: number;
  security_deposit: number | null;
  pet_deposit: number | null;
  other_deposits: Record<string, number>;
  late_fee_type: LateFeeType | null;
  late_fee_amount: number | null;
  late_fee_grace_days: number;
  utilities_included: string[];
  parking_spaces: number;
  storage_included: boolean;
  status: LeaseStatus;
  signed_date: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  termination_reason: string | null;
  termination_date: string | null;
  notice_given_date: string | null;
  document_url: string | null;
  signature_request_id: string | null;
  custom_clauses: string[];
  ai_compliance_check: Record<string, any> | null;
  addenda: string[];
  renewal_offered: boolean;
  renewal_offer_date: string | null;
  renewal_offer_terms: Record<string, any> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaseInput {
  tenant_id: string;
  property_id: string;
  unit_id?: string | null;
  tenant_profile_id: string;
  lease_type: LeaseType;
  start_date: string;
  end_date?: string | null;
  rent_amount: number;
  rent_due_day?: number;
  security_deposit?: number | null;
  pet_deposit?: number | null;
  other_deposits?: Record<string, number>;
  late_fee_type?: LateFeeType | null;
  late_fee_amount?: number | null;
  late_fee_grace_days?: number;
  utilities_included?: string[];
  parking_spaces?: number;
  storage_included?: boolean;
  status?: LeaseStatus;
  move_in_date?: string | null;
  custom_clauses?: string[];
  notes?: string | null;
}

// ============================================================
// TRANSACTIONS
// ============================================================

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  tenant_id: string;
  property_id: string | null;
  unit_id: string | null;
  lease_id: string | null;
  tenant_profile_id: string | null;
  type: TransactionType;
  category: string;
  subcategory: string | null;
  amount: number;
  description: string | null;
  transaction_date: string;
  payment_method: string | null;
  stripe_payment_id: string | null;
  stripe_payout_id: string | null;
  vendor_id: string | null;
  work_order_id: string | null;
  bank_account_id: string | null;
  reconciled: boolean;
  reconciled_at: string | null;
  tax_category: string | null;
  is_capital_expense: boolean;
  receipt_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionInput {
  tenant_id: string;
  property_id?: string | null;
  unit_id?: string | null;
  lease_id?: string | null;
  tenant_profile_id?: string | null;
  type: TransactionType;
  category: string;
  subcategory?: string | null;
  amount: number;
  description?: string | null;
  transaction_date: string;
  payment_method?: string | null;
  vendor_id?: string | null;
  work_order_id?: string | null;
  tax_category?: string | null;
  is_capital_expense?: boolean;
  receipt_url?: string | null;
  notes?: string | null;
}

// ============================================================
// WORK ORDERS
// ============================================================

export type WorkOrderPriority = 'emergency' | 'urgent' | 'routine' | 'preventive';
export type WorkOrderStatus = 'new' | 'triaged' | 'assigned' | 'scheduled' | 'in_progress' | 'pending_approval' | 'completed' | 'canceled';
export type WorkOrderSource = 'tenant' | 'owner' | 'pm' | 'ai' | 'preventive' | 'inspection';

export interface WorkOrder {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id: string | null;
  tenant_profile_id: string | null;
  title: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  source: WorkOrderSource;
  ai_triage: Record<string, any> | null;
  photos: string[];
  videos: string[];
  location_in_unit: string | null;
  access_instructions: string | null;
  tenant_available_times: Record<string, any> | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  vendor_id: string | null;
  assigned_at: string | null;
  scheduled_date: string | null;
  scheduled_time_start: string | null;
  scheduled_time_end: string | null;
  started_at: string | null;
  completed_at: string | null;
  completion_photos: string[];
  completion_notes: string | null;
  owner_approved: boolean | null;
  owner_approved_at: string | null;
  owner_approved_by: string | null;
  warranty_claim: boolean;
  warranty_claim_status: string | null;
  invoice_id: string | null;
  tenant_rating: number | null;
  tenant_feedback: string | null;
  internal_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderInput {
  tenant_id: string;
  property_id: string;
  unit_id?: string | null;
  tenant_profile_id?: string | null;
  title: string;
  description?: string | null;
  category: string;
  subcategory?: string | null;
  priority?: WorkOrderPriority;
  status?: WorkOrderStatus;
  source?: WorkOrderSource;
  photos?: string[];
  location_in_unit?: string | null;
  access_instructions?: string | null;
  tenant_available_times?: Record<string, any> | null;
  estimated_cost?: number | null;
  internal_notes?: string | null;
}

// ============================================================
// VENDORS
// ============================================================

export type VendorStatus = 'pending' | 'approved' | 'active' | 'suspended' | 'preferred' | 'inactive';

export interface Vendor {
  id: string;
  tenant_id: string | null;
  company_name: string;
  contact_name: string | null;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  categories: string[];
  service_areas: string[];
  license_number: string | null;
  license_state: string | null;
  license_verified: boolean;
  license_expiry: string | null;
  insurance_carrier: string | null;
  insurance_policy_number: string | null;
  insurance_verified: boolean;
  insurance_expiry: string | null;
  insurance_document_url: string | null;
  w9_on_file: boolean;
  w9_document_url: string | null;
  ein: string | null;
  hourly_rate: number | null;
  emergency_available: boolean;
  emergency_rate_multiplier: number;
  status: VendorStatus;
  reliability_score: number | null;
  quality_score: number | null;
  price_score: number | null;
  response_time_avg_hours: number | null;
  jobs_completed: number;
  jobs_on_time: number;
  total_revenue: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorInput {
  tenant_id?: string | null;
  company_name: string;
  contact_name?: string | null;
  email: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  categories: string[];
  service_areas?: string[];
  license_number?: string | null;
  license_state?: string | null;
  hourly_rate?: number | null;
  emergency_available?: boolean;
  status?: VendorStatus;
  notes?: string | null;
}

// ============================================================
// VENDOR BIDS
// ============================================================

export type BidStatus = 'submitted' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';

export interface VendorBid {
  id: string;
  work_order_id: string;
  vendor_id: string;
  bid_amount: number;
  estimated_hours: number | null;
  materials_cost: number | null;
  labor_cost: number | null;
  available_date: string | null;
  available_time_start: string | null;
  available_time_end: string | null;
  completion_estimate_days: number | null;
  notes: string | null;
  status: BidStatus;
  ai_score: number | null;
  ai_ranking: number | null;
  ai_recommendation: string | null;
  submitted_at: string;
  responded_at: string | null;
  created_at: string;
}

export interface VendorBidInput {
  work_order_id: string;
  vendor_id: string;
  bid_amount: number;
  estimated_hours?: number | null;
  materials_cost?: number | null;
  labor_cost?: number | null;
  available_date?: string | null;
  available_time_start?: string | null;
  available_time_end?: string | null;
  completion_estimate_days?: number | null;
  notes?: string | null;
}

// ============================================================
// LEADS
// ============================================================

export type LeadType = 'tenant' | 'owner' | 'buyer' | 'seller' | 'mortgage' | 'vendor';

export interface Lead {
  id: string;
  tenant_id: string;
  lead_type: LeadType;
  source: string | null;
  source_url: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  property_id: string | null;
  unit_id: string | null;
  interested_in: Record<string, any> | null;
  pipeline_stage: string;
  ai_qualification_score: number | null;
  ai_qualification_reasons: Record<string, any> | null;
  assigned_to: string | null;
  last_contact_at: string | null;
  last_contact_method: string | null;
  next_action: string | null;
  next_action_date: string | null;
  move_in_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  beds_wanted: number | null;
  baths_wanted: number | null;
  pets: Record<string, any> | null;
  notes: string | null;
  tags: string[];
  is_qualified: boolean | null;
  qualified_at: string | null;
  converted_to: string | null;
  converted_at: string | null;
  lost_reason: string | null;
  lost_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadInput {
  tenant_id: string;
  lead_type: LeadType;
  source?: string | null;
  source_url?: string | null;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  property_id?: string | null;
  unit_id?: string | null;
  interested_in?: Record<string, any> | null;
  pipeline_stage?: string;
  assigned_to?: string | null;
  move_in_date?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  beds_wanted?: number | null;
  baths_wanted?: number | null;
  pets?: Record<string, any> | null;
  notes?: string | null;
  tags?: string[];
}

// ============================================================
// CONVERSATIONS
// ============================================================

export type ConversationChannel = 'email' | 'sms' | 'phone' | 'chat' | 'portal' | 'voicemail';
export type ConversationDirection = 'inbound' | 'outbound';

export interface Conversation {
  id: string;
  tenant_id: string;
  lead_id: string | null;
  tenant_profile_id: string | null;
  vendor_id: string | null;
  property_id: string | null;
  channel: ConversationChannel;
  direction: ConversationDirection;
  from_address: string | null;
  to_address: string | null;
  subject: string | null;
  body: string;
  html_body: string | null;
  is_ai_response: boolean;
  ai_model_used: string | null;
  ai_prompt_id: string | null;
  ai_sentiment: string | null;
  ai_intent: string | null;
  ai_suggested_response: string | null;
  attachments: string[];
  call_duration_seconds: number | null;
  call_recording_url: string | null;
  call_transcription: string | null;
  voicemail_url: string | null;
  voicemail_transcription: string | null;
  read_at: string | null;
  responded_at: string | null;
  twilio_sid: string | null;
  sendgrid_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ConversationInput {
  tenant_id: string;
  lead_id?: string | null;
  tenant_profile_id?: string | null;
  vendor_id?: string | null;
  property_id?: string | null;
  channel: ConversationChannel;
  direction: ConversationDirection;
  from_address?: string | null;
  to_address?: string | null;
  subject?: string | null;
  body: string;
  html_body?: string | null;
  is_ai_response?: boolean;
  attachments?: string[];
}

// ============================================================
// SHOWINGS
// ============================================================

export type ShowingType = 'in_person' | 'virtual' | 'self_guided';
export type ShowingStatus = 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'canceled' | 'rescheduled';

export interface Showing {
  id: string;
  tenant_id: string;
  lead_id: string;
  property_id: string;
  unit_id: string | null;
  showing_type: ShowingType;
  scheduled_at: string;
  duration_minutes: number;
  status: ShowingStatus;
  agent_id: string | null;
  smart_lock_code: string | null;
  smart_lock_code_expires: string | null;
  access_instructions: string | null;
  reminder_sent: boolean;
  confirmation_sent: boolean;
  notes: string | null;
  feedback: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ShowingInput {
  tenant_id: string;
  lead_id: string;
  property_id: string;
  unit_id?: string | null;
  showing_type: ShowingType;
  scheduled_at: string;
  duration_minutes?: number;
  status?: ShowingStatus;
  agent_id?: string | null;
  access_instructions?: string | null;
  notes?: string | null;
}

// ============================================================
// EXTENDED TYPES WITH RELATIONS
// ============================================================

export interface PropertyWithUnits extends Property {
  units: Unit[];
}

export interface UnitWithProperty extends Unit {
  property: Property;
}

export interface LeaseWithRelations extends Lease {
  property: Property;
  unit: Unit | null;
  tenant_profile: TenantProfile;
}

export interface WorkOrderWithRelations extends WorkOrder {
  property: Property;
  unit: Unit | null;
  tenant_profile: TenantProfile | null;
  vendor: Vendor | null;
}

export interface LeadWithRelations extends Lead {
  property: Property | null;
  unit: Unit | null;
  assigned_user: { id: string; full_name: string } | null;
}
