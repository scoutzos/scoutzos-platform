-- Migration: Add Discovery Session Enhancements
-- Adds support for tracking last asked cluster and education history

-- Add last_asked_cluster column to track which cluster was last asked about
ALTER TABLE discovery_sessions
ADD COLUMN IF NOT EXISTS last_asked_cluster TEXT;

-- Add education_given array to track which topics have been explained
ALTER TABLE discovery_sessions
ADD COLUMN IF NOT EXISTS education_given TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN discovery_sessions.last_asked_cluster IS 'The last investor profile cluster that was asked about (motivation, capital, etc.)';
COMMENT ON COLUMN discovery_sessions.education_given IS 'Array of education topics that have been explained to the user during this session';

-- Create index for faster lookups on active sessions with specific clusters
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_last_cluster
ON discovery_sessions (user_id, last_asked_cluster)
WHERE status IN ('ACTIVE', 'IN_PROGRESS', 'IDLE');
