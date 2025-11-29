/**
 * Session Types
 * Type definitions for session management
 */

import type { SessionStatus, TransitionTrigger } from './state-machine';

// Conversation message
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  cluster?: string;
  extracted_data?: Record<string, unknown>;
}

// Partial profile (accumulated during discovery)
export interface PartialProfile {
  motivation?: {
    primary_goal?: string;
    secondary_goal?: string;
    why_real_estate?: string;
    financial_freedom_target?: number;
  };
  capital?: {
    cash_available?: number;
    reserve_target?: number;
    deployable?: number;
    access_to_credit?: boolean;
    has_partners?: boolean;
    partner_capital?: number;
  };
  credit_income?: {
    credit_score_band?: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
    income_stability?: 'w2_stable' | 'w2_variable' | 'self_employed' | 'retired' | 'other';
    monthly_income?: number;
    can_cover_vacancy?: boolean;
    dti_estimate?: number;
  };
  activity?: {
    time_available?: 'very_limited' | 'limited' | 'moderate' | 'significant' | 'full_time';
    hours_per_week?: number;
    renovation_comfort?: 'none' | 'cosmetic' | 'moderate' | 'major' | 'gut';
    property_management?: 'self' | 'hybrid' | 'full_service';
    handyman_skills?: boolean;
  };
  risk?: {
    risk_comfort?: 'conservative' | 'moderate' | 'aggressive';
    market_preference?: 'a_class' | 'b_class' | 'c_class' | 'd_class' | 'any';
    year_built_preference?: 'new' | '1990s_plus' | '1970s_plus' | 'any';
    condition_tolerance?: 'turnkey' | 'light_rehab' | 'heavy_rehab' | 'any';
    vacancy_tolerance_months?: number;
  };
  geography?: {
    location_constraint?: 'local' | 'regional' | 'national' | 'virtual';
    home_market?: { city?: string; state?: string; zip?: string };
    target_markets?: Array<{ city?: string; state?: string; reason?: string }>;
    max_distance_miles?: number;
    willing_to_travel?: boolean;
  };
  timeline?: {
    first_deal_timeline?: 'asap' | '3_months' | '6_months' | '12_months' | 'exploring';
    capital_return_need?: 'none' | '1_year' | '3_years' | '5_years' | '10_plus';
    exit_preference?: 'hold_forever' | 'refinance' | 'sell_5yr' | 'sell_10yr' | 'flexible';
    portfolio_target_5yr?: number;
  };
  experience?: {
    properties_owned?: number;
    years_investing?: number;
    strategies_used?: string[];
    biggest_challenge?: string;
  };
}

// UI state for resuming sessions
export interface UIState {
  scroll_position?: number;
  input_draft?: string;
  pending_action?: string | null;
  expanded_sections?: string[];
}

// Error details
export interface ErrorDetails {
  code: string;
  message: string;
  recoverable: boolean;
  stack?: string;
  context?: Record<string, unknown>;
}

// Client info
export interface ClientInfo {
  user_agent?: string;
  platform?: string;
  timezone?: string;
  screen_size?: string;
  locale?: string;
}

// Full session type (from database)
export interface DiscoverySession {
  id: string;
  user_id: string;

  // Status
  status: SessionStatus;
  mode: 'discovery' | 'analysis' | 'comparison' | 'refinement';
  entry_point?: string;

  // Conversation
  conversation_history: ConversationMessage[];
  partial_profile: PartialProfile;

  // Progress
  clusters_complete: number;
  current_cluster?: string;
  ready_for_recommendation: boolean;

  // Message tracking
  message_count: number;
  last_user_message?: string;
  last_assistant_message?: string;

  // Timestamps
  created_at: string;
  started_at?: string;
  last_activity: string;
  idle_since?: string;
  paused_at?: string;
  expired_at?: string;
  completed_at?: string;
  archived_at?: string;

  // Error
  error_at?: string;
  error_details?: ErrorDetails;

  // Outcomes
  final_profile_id?: string;
  buy_box_id?: string;

  // State
  ui_state: UIState;
  client_info: ClientInfo;
}

// Session creation params
export interface CreateSessionParams {
  user_id: string;
  entry_point?: string;
  initial_message?: string;
  mode?: 'discovery' | 'analysis' | 'comparison' | 'refinement';
  client_info?: ClientInfo;
}

// Session update params
export interface UpdateSessionParams {
  status?: SessionStatus;
  conversation_history?: ConversationMessage[];
  partial_profile?: PartialProfile;
  clusters_complete?: number;
  current_cluster?: string;
  ready_for_recommendation?: boolean;
  message_count?: number;
  last_user_message?: string;
  last_assistant_message?: string;
  ui_state?: UIState;
  error_details?: ErrorDetails;
  final_profile_id?: string;
  buy_box_id?: string;
}

// Session history entry
export interface SessionHistoryEntry {
  id: string;
  session_id: string;
  previous_status?: SessionStatus;
  new_status: SessionStatus;
  trigger: TransitionTrigger;
  metadata: {
    duration_in_previous_ms?: number;
    reason?: string;
    [key: string]: unknown;
  };
  changed_at: string;
}

// Save trigger types
export type SaveTrigger =
  | 'message'
  | 'extraction'
  | 'idle'
  | 'blur'
  | 'periodic'
  | 'complete'
  | 'error';

// Auto-save request
export interface AutoSaveRequest {
  save_trigger: SaveTrigger;
  conversation?: ConversationMessage[];
  profile?: PartialProfile;
  ui_state?: UIState;
}

// Session summary (for listings)
export interface SessionSummary {
  id: string;
  status: SessionStatus;
  mode: string;
  entry_point?: string;
  clusters_complete: number;
  message_count: number;
  created_at: string;
  last_activity: string;
  has_buy_box: boolean;
  has_profile: boolean;
}
