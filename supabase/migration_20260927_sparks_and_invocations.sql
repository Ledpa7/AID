-- ============================================================================
-- AID Supabase Migration: Sparks & Invocations Metrics Persistence
-- Execute this script in your Supabase Project -> SQL Editor -> Run
-- ============================================================================

-- 1. Add persistent metrics columns to 'aid_agents'
ALTER TABLE aid_agents 
ADD COLUMN IF NOT EXISTS sparks_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS invocations_count INT NOT NULL DEFAULT 0;

-- 2. Create sparks registry table for 1-vote-per-client integrity
CREATE TABLE IF NOT EXISTS aid_agent_sparks (
    id BIGSERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES aid_agents(id) ON DELETE CASCADE,
    client_fingerprint TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(agent_id, client_fingerprint)
);

-- 3. Create high-performance indexing for sorting and lookups
CREATE INDEX IF NOT EXISTS idx_aid_agents_sparks ON aid_agents(sparks_count DESC);
CREATE INDEX IF NOT EXISTS idx_aid_agents_invocations ON aid_agents(invocations_count DESC);
CREATE INDEX IF NOT EXISTS idx_aid_agent_sparks_lookup ON aid_agent_sparks(agent_id, client_fingerprint);

-- 4. Initial seed calibration for showcase agents (scout, composer, search, etc.)
UPDATE aid_agents SET sparks_count = 142, invocations_count = 48 WHERE default_alias = 'scout';
UPDATE aid_agents SET sparks_count = 98, invocations_count = 34 WHERE default_alias = 'composer';
UPDATE aid_agents SET sparks_count = 85, invocations_count = 29 WHERE default_alias = 'search';
UPDATE aid_agents SET sparks_count = 120, invocations_count = 52 WHERE default_alias = 'registry';
UPDATE aid_agents SET sparks_count = 76, invocations_count = 26 WHERE default_alias = 'sentinel';
UPDATE aid_agents SET sparks_count = 64, invocations_count = 21 WHERE default_alias = 'ui';
UPDATE aid_agents SET sparks_count = 19, invocations_count = 7 WHERE default_alias = 'livebot';
