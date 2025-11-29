-- Migration: Add AI Advisor enhancements
-- Created: 2025-11-29
-- Description: Adds fields for comprehensive AI analysis and performance tracking

-- Update deal_insights table to store full analysis
ALTER TABLE IF EXISTS deal_insights 
ADD COLUMN IF NOT EXISTS full_analysis JSONB,
ADD COLUMN IF NOT EXISTS confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
ADD COLUMN IF NOT EXISTS prompt_version VARCHAR(10) DEFAULT '1.0';

-- Create AI performance tracking table
CREATE TABLE IF NOT EXISTS ai_performance_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    recommendation VARCHAR(20) NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    model VARCHAR(50) NOT NULL,
    prompt_version VARCHAR(10) NOT NULL,
    user_action VARCHAR(20), -- 'bought', 'passed', 'still_considering'
    actual_outcome JSONB, -- Store actual vs predicted metrics
    accuracy_score INTEGER CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for performance queries
CREATE INDEX IF NOT EXISTS idx_ai_performance_deal_id ON ai_performance_tracking(deal_id);
CREATE INDEX IF NOT EXISTS idx_ai_performance_generated_at ON ai_performance_tracking(generated_at DESC);

-- Add RLS policies
ALTER TABLE ai_performance_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI performance data"
    ON ai_performance_tracking FOR SELECT
    USING (
        deal_id IN (
            SELECT id FROM deals WHERE tenant_id IN (
                SELECT tenant_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "System can insert AI performance data"
    ON ai_performance_tracking FOR INSERT
    WITH CHECK (true);

-- Add comments
COMMENT ON TABLE ai_performance_tracking IS 'Tracks AI recommendation performance for learning and improvement';
COMMENT ON COLUMN ai_performance_tracking.recommendation IS 'AI recommendation: STRONG_BUY, BUY, HOLD, or PASS';
COMMENT ON COLUMN ai_performance_tracking.confidence IS 'AI confidence score 0-100';
COMMENT ON COLUMN ai_performance_tracking.user_action IS 'What the user actually did with the deal';
COMMENT ON COLUMN ai_performance_tracking.actual_outcome IS 'Actual financial outcomes vs predictions';
COMMENT ON COLUMN ai_performance_tracking.accuracy_score IS 'How accurate the AI prediction was';
