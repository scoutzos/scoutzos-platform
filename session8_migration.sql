-- Migration: Discovery Mode Session Management
-- Created: 2025-11-29
-- Description: Adds tables for Discovery Mode conversation sessions

-- Create discovery_sessions table
CREATE TABLE IF NOT EXISTS discovery_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'INITIAL',
    mode VARCHAR(20) NOT NULL DEFAULT 'discovery',
    entry_point VARCHAR(50),
    conversation_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    partial_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    clusters_complete INTEGER NOT NULL DEFAULT 0,
    ready_for_recommendation BOOLEAN NOT NULL DEFAULT false,
    message_count INTEGER NOT NULL DEFAULT 0,
    recommendation JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT valid_status CHECK (status IN ('INITIAL', 'IN_PROGRESS', 'READY_FOR_RECOMMENDATION', 'COMPLETED', 'ABANDONED')),
    CONSTRAINT valid_mode CHECK (mode IN ('discovery', 'analysis'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_user_id ON discovery_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_status ON discovery_sessions(status);
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_last_activity ON discovery_sessions(last_activity DESC);

-- Enable RLS
ALTER TABLE discovery_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own discovery sessions"
    ON discovery_sessions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own discovery sessions"
    ON discovery_sessions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own discovery sessions"
    ON discovery_sessions FOR UPDATE
    USING (user_id = auth.uid());

-- Add comments
COMMENT ON TABLE discovery_sessions IS 'Stores AI discovery conversation sessions for investor profiling';
COMMENT ON COLUMN discovery_sessions.status IS 'Session status: INITIAL, IN_PROGRESS, READY_FOR_RECOMMENDATION, COMPLETED, ABANDONED';
COMMENT ON COLUMN discovery_sessions.partial_profile IS 'Investor profile data extracted from conversation';
COMMENT ON COLUMN discovery_sessions.clusters_complete IS 'Number of profile clusters completed (0-7)';
COMMENT ON COLUMN discovery_sessions.recommendation IS 'Generated strategy recommendation and buy box';
