-- ============================================================
-- SCOUTZOS AI ADVISOR SCHEMA MIGRATION
-- Version: 1.0
-- Description: Creates tables for investor discovery sessions,
--              profiles, and enhances buy_boxes/deal_metrics
-- ============================================================

-- ============================================================
-- SECTION 1: NEW TABLES
-- ============================================================

-- 1. Investor Profiles
-- Stores the outcome of discovery sessions - the investor's strategy profile
CREATE TABLE IF NOT EXISTS investor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- AI-recommended strategy
    recommended_strategy TEXT CHECK (recommended_strategy IN (
        'buy_hold', 'brrrr', 'flip', 'wholesale', 'str', 'mtr',
        'house_hack', 'subject_to', 'seller_finance', 'syndication'
    )),
    strategy_confidence INTEGER CHECK (strategy_confidence >= 0 AND strategy_confidence <= 100),

    -- Motivation cluster
    motivation JSONB DEFAULT '{}'::jsonb,
    -- {
    --   "primary_goal": "cash_flow" | "appreciation" | "equity_build" | "tax_benefits" | "retirement",
    --   "secondary_goal": "...",
    --   "why_real_estate": "text",
    --   "financial_freedom_target": number
    -- }

    -- Capital cluster
    capital JSONB DEFAULT '{}'::jsonb,
    -- {
    --   "cash_available": number,
    --   "reserve_target": number,
    --   "deployable": number,
    --   "access_to_credit": boolean,
    --   "has_partners": boolean,
    --   "partner_capital": number
    -- }

    -- Credit & Income cluster
    credit_income JSONB DEFAULT '{}'::jsonb,
    -- {
    --   "credit_score_band": "excellent" | "good" | "fair" | "poor" | "unknown",
    --   "income_stability": "w2_stable" | "w2_variable" | "self_employed" | "retired" | "other",
    --   "monthly_income": number,
    --   "can_cover_vacancy": boolean,
    --   "dti_estimate": number
    -- }

    -- Activity/Involvement cluster
    activity JSONB DEFAULT '{}'::jsonb,
    -- {
    --   "time_available": "very_limited" | "limited" | "moderate" | "significant" | "full_time",
    --   "hours_per_week": number,
    --   "renovation_comfort": "none" | "cosmetic" | "moderate" | "major" | "gut",
    --   "property_management": "self" | "hybrid" | "full_service",
    --   "handyman_skills": boolean
    -- }

    -- Risk cluster
    risk JSONB DEFAULT '{}'::jsonb,
    -- {
    --   "risk_comfort": "conservative" | "moderate" | "aggressive",
    --   "market_preference": "a_class" | "b_class" | "c_class" | "d_class" | "any",
    --   "year_built_preference": "new" | "1990s_plus" | "1970s_plus" | "any",
    --   "condition_tolerance": "turnkey" | "light_rehab" | "heavy_rehab" | "any",
    --   "vacancy_tolerance_months": number
    -- }

    -- Geography cluster
    geography JSONB DEFAULT '{}'::jsonb,
    -- {
    --   "location_constraint": "local" | "regional" | "national" | "virtual",
    --   "home_market": { "city": "...", "state": "...", "zip": "..." },
    --   "target_markets": [{ "city": "...", "state": "...", "reason": "..." }],
    --   "max_distance_miles": number,
    --   "willing_to_travel": boolean
    -- }

    -- Timeline cluster
    timeline JSONB DEFAULT '{}'::jsonb,
    -- {
    --   "first_deal_timeline": "asap" | "3_months" | "6_months" | "12_months" | "exploring",
    --   "capital_return_need": "none" | "1_year" | "3_years" | "5_years" | "10_plus",
    --   "exit_preference": "hold_forever" | "refinance" | "sell_5yr" | "sell_10yr" | "flexible",
    --   "portfolio_target_5yr": number
    -- }

    -- Experience (optional, for returning users)
    experience JSONB DEFAULT '{}'::jsonb,
    -- {
    --   "properties_owned": number,
    --   "years_investing": number,
    --   "strategies_used": [],
    --   "biggest_challenge": "text"
    -- }

    -- Metadata
    version INTEGER DEFAULT 1,
    is_complete BOOLEAN DEFAULT FALSE,
    completeness_score INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_investor_profiles_user_id ON investor_profiles(user_id);
CREATE INDEX idx_investor_profiles_strategy ON investor_profiles(recommended_strategy);

-- 2. Discovery Sessions
-- Tracks the state of AI advisor conversations
CREATE TABLE IF NOT EXISTS discovery_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Session status lifecycle
    status TEXT NOT NULL DEFAULT 'INITIAL' CHECK (status IN (
        'INITIAL',      -- Created but no messages yet
        'ACTIVE',       -- User engaged, recent activity
        'IDLE',         -- No activity for 5+ minutes
        'PAUSED',       -- User explicitly paused
        'COMPLETED',    -- Profile generated, buy box created
        'EXPIRED',      -- Session timed out (24h+)
        'ARCHIVED',     -- User archived old session
        'ERROR'         -- Something went wrong
    )),

    -- Session mode
    mode TEXT NOT NULL DEFAULT 'discovery' CHECK (mode IN (
        'discovery',    -- Building investor profile
        'analysis',     -- Analyzing specific deal
        'comparison',   -- Comparing deals
        'refinement'    -- Adjusting buy box criteria
    )),

    -- Entry point tracking
    entry_point TEXT,  -- 'sidebar', 'deal_card', 'buy_box_edit', 'onboarding'

    -- Conversation state
    conversation_history JSONB DEFAULT '[]'::jsonb,
    -- [{ "role": "user"|"assistant", "content": "...", "timestamp": "...", "cluster": "..." }]

    -- Progressive profile building
    partial_profile JSONB DEFAULT '{}'::jsonb,
    -- Accumulates answers as user progresses through discovery

    -- Progress tracking
    clusters_complete INTEGER DEFAULT 0,  -- 0-7 (motivation, capital, credit, activity, risk, geography, timeline)
    current_cluster TEXT,  -- Which cluster we're currently exploring
    ready_for_recommendation BOOLEAN DEFAULT FALSE,

    -- Message tracking
    message_count INTEGER DEFAULT 0,
    last_user_message TEXT,
    last_assistant_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,           -- First message sent
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    idle_since TIMESTAMPTZ,           -- When it went idle
    paused_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,

    -- Error handling
    error_at TIMESTAMPTZ,
    error_details JSONB,
    -- { "code": "...", "message": "...", "recoverable": boolean }

    -- Outcomes
    final_profile_id UUID REFERENCES investor_profiles(id) ON DELETE SET NULL,
    buy_box_id UUID REFERENCES buy_boxes(id) ON DELETE SET NULL,

    -- UI state (for resuming exactly where left off)
    ui_state JSONB DEFAULT '{}'::jsonb,
    -- { "scroll_position": 0, "input_draft": "", "pending_action": null }

    -- Client info
    client_info JSONB DEFAULT '{}'::jsonb
    -- { "user_agent": "...", "platform": "...", "timezone": "..." }
);

CREATE INDEX idx_sessions_user_status ON discovery_sessions(user_id, status);
CREATE INDEX idx_sessions_last_activity ON discovery_sessions(last_activity)
    WHERE status IN ('ACTIVE', 'IDLE', 'PAUSED');
CREATE INDEX idx_sessions_user_id ON discovery_sessions(user_id);

-- 3. Session History (Audit Log)
-- Tracks all status transitions for debugging and analytics
CREATE TABLE IF NOT EXISTS session_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES discovery_sessions(id) ON DELETE CASCADE,

    previous_status TEXT,
    new_status TEXT NOT NULL,
    trigger TEXT,  -- 'user_message', 'timeout', 'user_pause', 'completion', 'error'

    metadata JSONB DEFAULT '{}'::jsonb,
    -- { "reason": "...", "duration_in_previous_ms": 12345 }

    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_history_session_id ON session_history(session_id);
CREATE INDEX idx_session_history_changed_at ON session_history(changed_at);


-- ============================================================
-- SECTION 2: ENHANCE EXISTING TABLES
-- ============================================================

-- 4. Enhance buy_boxes table
DO $$
BEGIN
    -- Strategy column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buy_boxes' AND column_name = 'strategy') THEN
        ALTER TABLE buy_boxes ADD COLUMN strategy TEXT CHECK (strategy IN (
            'buy_hold', 'brrrr', 'flip', 'wholesale', 'str', 'mtr',
            'house_hack', 'subject_to', 'seller_finance'
        ));
    END IF;

    -- Link to investor profile
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buy_boxes' AND column_name = 'investor_profile_id') THEN
        ALTER TABLE buy_boxes ADD COLUMN investor_profile_id UUID REFERENCES investor_profiles(id) ON DELETE SET NULL;
    END IF;

    -- Financial thresholds
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buy_boxes' AND column_name = 'min_profit_margin') THEN
        ALTER TABLE buy_boxes ADD COLUMN min_profit_margin DECIMAL(4,2);  -- For flips: min 15%
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buy_boxes' AND column_name = 'min_cash_on_cash') THEN
        ALTER TABLE buy_boxes ADD COLUMN min_cash_on_cash DECIMAL(4,2);  -- Min 8%
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buy_boxes' AND column_name = 'min_cap_rate') THEN
        ALTER TABLE buy_boxes ADD COLUMN min_cap_rate DECIMAL(4,2);  -- Min 6%
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buy_boxes' AND column_name = 'min_dscr') THEN
        -- Already exists in schema, but adding check
        NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buy_boxes' AND column_name = 'max_all_in_to_arv') THEN
        ALTER TABLE buy_boxes ADD COLUMN max_all_in_to_arv DECIMAL(4,2);  -- Max 75% for BRRRR
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buy_boxes' AND column_name = 'min_rent_to_price') THEN
        ALTER TABLE buy_boxes ADD COLUMN min_rent_to_price DECIMAL(5,4);  -- 1% rule = 0.01
    END IF;

    -- Property condition filters
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buy_boxes' AND column_name = 'condition') THEN
        ALTER TABLE buy_boxes ADD COLUMN condition TEXT[];  -- ['turnkey', 'light_rehab', 'heavy_rehab']
    END IF;

    -- Listing type filters
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buy_boxes' AND column_name = 'listing_types') THEN
        ALTER TABLE buy_boxes ADD COLUMN listing_types TEXT[];  -- ['mls', 'auction', 'wholesale', 'fsbo']
    END IF;

    -- Days on market filter
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buy_boxes' AND column_name = 'days_on_market_max') THEN
        ALTER TABLE buy_boxes ADD COLUMN days_on_market_max INTEGER;
    END IF;

    -- Motivated seller filter
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buy_boxes' AND column_name = 'motivated_seller') THEN
        ALTER TABLE buy_boxes ADD COLUMN motivated_seller BOOLEAN DEFAULT FALSE;
    END IF;

    -- AI-generated flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buy_boxes' AND column_name = 'ai_generated') THEN
        ALTER TABLE buy_boxes ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE;
    END IF;

    -- Source session
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buy_boxes' AND column_name = 'source_session_id') THEN
        ALTER TABLE buy_boxes ADD COLUMN source_session_id UUID REFERENCES discovery_sessions(id) ON DELETE SET NULL;
    END IF;
END $$;


-- 5. Enhance deal_metrics table
DO $$
BEGIN
    -- All-in cost (purchase + closing + rehab)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_metrics' AND column_name = 'all_in_cost') THEN
        ALTER TABLE deal_metrics ADD COLUMN all_in_cost DECIMAL(12,2);
    END IF;

    -- ARV (After Repair Value)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_metrics' AND column_name = 'arv') THEN
        ALTER TABLE deal_metrics ADD COLUMN arv DECIMAL(12,2);
    END IF;

    -- All-in to ARV ratio (for BRRRR analysis)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_metrics' AND column_name = 'all_in_to_arv') THEN
        ALTER TABLE deal_metrics ADD COLUMN all_in_to_arv DECIMAL(4,2);
    END IF;

    -- Potential profit (for flips)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_metrics' AND column_name = 'potential_profit') THEN
        ALTER TABLE deal_metrics ADD COLUMN potential_profit DECIMAL(12,2);
    END IF;

    -- Profit margin percentage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_metrics' AND column_name = 'profit_margin') THEN
        ALTER TABLE deal_metrics ADD COLUMN profit_margin DECIMAL(4,2);
    END IF;

    -- Rent to price ratio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_metrics' AND column_name = 'rent_to_price') THEN
        ALTER TABLE deal_metrics ADD COLUMN rent_to_price DECIMAL(6,4);
    END IF;

    -- Gross yield
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_metrics' AND column_name = 'gross_yield') THEN
        ALTER TABLE deal_metrics ADD COLUMN gross_yield DECIMAL(5,2);
    END IF;

    -- Assumptions used for calculations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_metrics' AND column_name = 'assumptions') THEN
        ALTER TABLE deal_metrics ADD COLUMN assumptions JSONB DEFAULT '{}'::jsonb;
    END IF;
    -- {
    --   "vacancy_rate": 0.05,
    --   "maintenance_rate": 0.05,
    --   "capex_rate": 0.05,
    --   "management_rate": 0.08,
    --   "down_payment_pct": 0.25,
    --   "interest_rate": 0.07,
    --   "loan_term_years": 30,
    --   "closing_cost_pct": 0.03,
    --   "selling_cost_pct": 0.06
    -- }
END $$;


-- ============================================================
-- SECTION 3: INDEXES FOR PERFORMANCE
-- ============================================================

-- Deals matching index
CREATE INDEX IF NOT EXISTS idx_deals_matching
    ON deals(property_type, list_price, state, status);

-- Deal metrics scoring index
CREATE INDEX IF NOT EXISTS idx_deal_metrics_scores
    ON deal_metrics(cap_rate, cash_on_cash, dscr);

-- Buy box strategy index
CREATE INDEX IF NOT EXISTS idx_buy_boxes_strategy
    ON buy_boxes(strategy) WHERE strategy IS NOT NULL;

-- Investor profile user index (if not exists)
CREATE INDEX IF NOT EXISTS idx_investor_profiles_user_complete
    ON investor_profiles(user_id, is_complete);


-- ============================================================
-- SECTION 4: ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_history ENABLE ROW LEVEL SECURITY;

-- Investor Profiles: Users can only access their own profiles
CREATE POLICY "Users can view own investor profiles" ON investor_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own investor profiles" ON investor_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own investor profiles" ON investor_profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own investor profiles" ON investor_profiles
    FOR DELETE USING (user_id = auth.uid());

-- Discovery Sessions: Users can only access their own sessions
CREATE POLICY "Users can view own discovery sessions" ON discovery_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own discovery sessions" ON discovery_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own discovery sessions" ON discovery_sessions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own discovery sessions" ON discovery_sessions
    FOR DELETE USING (user_id = auth.uid());

-- Session History: Users can view history for their sessions
CREATE POLICY "Users can view own session history" ON session_history
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM discovery_sessions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own session history" ON session_history
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM discovery_sessions WHERE user_id = auth.uid()
        )
    );


-- ============================================================
-- SECTION 5: TRIGGERS
-- ============================================================

-- Auto-update updated_at for new tables
CREATE TRIGGER update_investor_profiles_updated_at
    BEFORE UPDATE ON investor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_discovery_sessions_updated_at
    BEFORE UPDATE ON discovery_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-log session status changes
CREATE OR REPLACE FUNCTION log_session_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO session_history (session_id, previous_status, new_status, trigger, metadata)
        VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(current_setting('app.status_trigger', true), 'unknown'),
            jsonb_build_object(
                'duration_in_previous_ms',
                EXTRACT(EPOCH FROM (NOW() - COALESCE(OLD.last_activity, OLD.created_at))) * 1000
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_session_status_changes
    AFTER UPDATE ON discovery_sessions
    FOR EACH ROW EXECUTE FUNCTION log_session_status_change();


-- ============================================================
-- SECTION 6: HELPER FUNCTIONS
-- ============================================================

-- Function to get or create active session for user
CREATE OR REPLACE FUNCTION get_or_create_discovery_session(p_user_id UUID, p_entry_point TEXT DEFAULT 'sidebar')
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Look for existing active/idle/paused session
    SELECT id INTO v_session_id
    FROM discovery_sessions
    WHERE user_id = p_user_id
      AND status IN ('INITIAL', 'ACTIVE', 'IDLE', 'PAUSED')
    ORDER BY last_activity DESC
    LIMIT 1;

    -- If found, return it (and mark as active)
    IF v_session_id IS NOT NULL THEN
        UPDATE discovery_sessions
        SET status = 'ACTIVE',
            last_activity = NOW(),
            idle_since = NULL
        WHERE id = v_session_id;
        RETURN v_session_id;
    END IF;

    -- Otherwise create new session
    INSERT INTO discovery_sessions (user_id, status, entry_point)
    VALUES (p_user_id, 'INITIAL', p_entry_point)
    RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire stale sessions (run via cron)
CREATE OR REPLACE FUNCTION expire_stale_sessions()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE discovery_sessions
    SET status = 'EXPIRED',
        expired_at = NOW()
    WHERE status IN ('ACTIVE', 'IDLE', 'PAUSED')
      AND last_activity < NOW() - INTERVAL '24 hours';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark session idle (called when no activity for 5 min)
CREATE OR REPLACE FUNCTION mark_session_idle(p_session_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE discovery_sessions
    SET status = 'IDLE',
        idle_since = NOW()
    WHERE id = p_session_id
      AND status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- SECTION 7: COMMENTS
-- ============================================================

COMMENT ON TABLE investor_profiles IS 'Stores investor discovery outcomes - strategy recommendations and preferences';
COMMENT ON TABLE discovery_sessions IS 'Tracks AI advisor conversation state and progress';
COMMENT ON TABLE session_history IS 'Audit log of all session status transitions';

COMMENT ON COLUMN investor_profiles.motivation IS 'Investor goals: primary_goal, secondary_goal, why_real_estate';
COMMENT ON COLUMN investor_profiles.capital IS 'Available capital: cash_available, reserve_target, deployable';
COMMENT ON COLUMN investor_profiles.credit_income IS 'Credit/income profile: credit_score_band, income_stability';
COMMENT ON COLUMN investor_profiles.activity IS 'Time/involvement: time_available, renovation_comfort, property_management';
COMMENT ON COLUMN investor_profiles.risk IS 'Risk tolerance: risk_comfort, market_preference, condition_tolerance';
COMMENT ON COLUMN investor_profiles.geography IS 'Location preferences: home_market, target_markets, max_distance';
COMMENT ON COLUMN investor_profiles.timeline IS 'Investment timeline: first_deal_timeline, exit_preference';

COMMENT ON COLUMN discovery_sessions.partial_profile IS 'Accumulates answers during discovery before finalizing profile';
COMMENT ON COLUMN discovery_sessions.clusters_complete IS 'Number of discovery clusters completed (0-7)';
COMMENT ON COLUMN discovery_sessions.ui_state IS 'UI state for resuming session exactly where left off';


-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
