-- Create deal_metrics table
CREATE TABLE IF NOT EXISTS deal_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE UNIQUE,
    monthly_rent NUMERIC(10, 2),
    monthly_expenses NUMERIC(10, 2),
    monthly_noi NUMERIC(10, 2),
    monthly_cash_flow NUMERIC(10, 2),
    annual_noi NUMERIC(12, 2),
    annual_cash_flow NUMERIC(12, 2),
    cap_rate NUMERIC(5, 2),
    cash_on_cash NUMERIC(5, 2),
    dscr NUMERIC(5, 2),
    total_investment NUMERIC(12, 2),
    assumptions_json JSONB DEFAULT '{}',
    metrics_json JSONB DEFAULT '{}',
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_metrics_deal_id ON deal_metrics(deal_id);
ALTER TABLE deal_metrics ENABLE ROW LEVEL SECURITY;

-- Add columns to deals if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'estimated_rent') THEN
        ALTER TABLE deals ADD COLUMN estimated_rent NUMERIC(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'insurance_annual') THEN
        ALTER TABLE deals ADD COLUMN insurance_annual NUMERIC(10, 2);
    END IF;
END $$;

-- Create deal_matches table
CREATE TABLE IF NOT EXISTS deal_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    buy_box_id UUID NOT NULL REFERENCES buy_boxes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    match_reasons JSONB DEFAULT '[]',
    user_action TEXT CHECK (user_action IN ('liked', 'passed', 'saved', 'offered')),
    swiped_at TIMESTAMPTZ,
    alert_sent BOOLEAN DEFAULT FALSE,
    alert_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(deal_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_deal_matches_deal_id ON deal_matches(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_matches_buy_box_id ON deal_matches(buy_box_id);
CREATE INDEX IF NOT EXISTS idx_deal_matches_user_id ON deal_matches(user_id);
ALTER TABLE deal_matches ENABLE ROW LEVEL SECURITY;
