-- ==========================================
-- AID (AI Agent Identity Infrastructure) Schema
-- PostgreSQL / Supabase Migration
-- Tables are prefixed with 'aid_' to coexist cleanly in shared Supabase projects
-- ==========================================

-- 1. Namespaces (@jidoo, @samsung, etc.)
CREATE TABLE IF NOT EXISTS aid_namespaces (
    id TEXT PRIMARY KEY,                       -- e.g., 'ns_01K72M...' or slug
    slug TEXT UNIQUE NOT NULL,                  -- e.g., 'jidoo' (used as @jidoo)
    name TEXT NOT NULL,                         -- Human-readable name: 'Jidoo Lab'
    owner_id UUID,                              -- Supabase Auth User ID (nullable for system/reserved)
    domain TEXT,                                -- Associated domain: 'jidoo.net'
    status TEXT NOT NULL DEFAULT 'CLAIMED',     -- AVAILABLE, CLAIMED, RESERVED, VERIFICATION_REQUIRED, SUSPENDED
    is_verified BOOLEAN NOT NULL DEFAULT FALSE, -- Domain TXT verification status
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Agents (Core Permanent Identity)
CREATE TABLE IF NOT EXISTS aid_agents (
    id TEXT PRIMARY KEY,                       -- Permanent AID: 'aid_01K72M8KQ4A7F'
    namespace_id TEXT NOT NULL REFERENCES aid_namespaces(id) ON DELETE RESTRICT,
    default_alias TEXT NOT NULL,                -- e.g., 'research' -> 'research@jidoo'
    display_name TEXT NOT NULL,                 -- e.g., 'Technology Research Agent'
    description TEXT,                           -- Description / Capabilities summary
    visibility TEXT NOT NULL DEFAULT 'PUBLIC',  -- PUBLIC, UNLISTED, PRIVATE
    status TEXT NOT NULL DEFAULT 'ACTIVE',      -- ACTIVE, SUSPENDED, COMPROMISED, REVOKED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Agent Aliases (Human-readable Addresses)
CREATE TABLE IF NOT EXISTS aid_agent_aliases (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES aid_agents(id) ON DELETE CASCADE,
    namespace_id TEXT NOT NULL REFERENCES aid_namespaces(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,                        -- e.g., 'research'
    full_address TEXT UNIQUE NOT NULL,          -- e.g., 'research@jidoo'
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Agent Endpoints (A2A, MCP, REST communication targets)
CREATE TABLE IF NOT EXISTS aid_agent_endpoints (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES aid_agents(id) ON DELETE CASCADE,
    protocol TEXT NOT NULL,                     -- 'a2a', 'mcp', 'rest'
    url TEXT NOT NULL,                          -- e.g., 'https://agent.example.com/a2a'
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Agent Cards (A2A Specification Snapshots)
CREATE TABLE IF NOT EXISTS aid_agent_cards (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES aid_agents(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,                   -- 'https://example.com/.well-known/agent-card.json'
    snapshot_json JSONB NOT NULL,               -- Fetched Card payload
    sha256_hash TEXT NOT NULL,                  -- Content integrity hash
    status TEXT NOT NULL DEFAULT 'VALID',       -- VALID, EXPIRED, FETCH_FAILED
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Agent Public Keys (Ed25519 Cryptographic Identity)
CREATE TABLE IF NOT EXISTS aid_agent_keys (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES aid_agents(id) ON DELETE CASCADE,
    key_type TEXT NOT NULL DEFAULT 'Ed25519',
    public_key TEXT NOT NULL,                   -- Base64 or Hex public key
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Identity Events (Append-only Audit Log / Hash Chain)
CREATE TABLE IF NOT EXISTS aid_identity_events (
    id BIGSERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES aid_agents(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,                   -- AGENT_CREATED, KEY_ROTATED, ENDPOINT_UPDATED, VERIFIED
    payload JSONB NOT NULL,
    prev_hash TEXT,
    event_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Domain Verifications (DNS TXT based verification)
CREATE TABLE IF NOT EXISTS aid_domain_verifications (
    id TEXT PRIMARY KEY,
    namespace_id TEXT NOT NULL REFERENCES aid_namespaces(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    challenge_token TEXT NOT NULL,              -- e.g., 'aid-verification=01K72...'
    status TEXT NOT NULL DEFAULT 'PENDING',     -- PENDING, VERIFIED, FAILED
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. API Keys (Access control for Developer Console & Programmatic APIs)
CREATE TABLE IF NOT EXISTS aid_api_keys (
    id TEXT PRIMARY KEY,
    owner_id UUID,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{"read", "write"}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Enrollment Tokens (Agent-native Self-Enrollment & Quotas)
CREATE TABLE IF NOT EXISTS aid_enrollment_tokens (
    id TEXT PRIMARY KEY,                       -- e.g. 'tok_01M...'
    namespace_id TEXT NOT NULL REFERENCES aid_namespaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                         -- Human-readable name: 'Production Cluster Auto-Enroll'
    token_hash TEXT NOT NULL,                   -- SHA-256 hash of plaintext token
    token_prefix TEXT NOT NULL,                 -- e.g. 'aid_enroll_7a8b...' for dashboard display
    scopes TEXT[] NOT NULL DEFAULT '{"agent:create"}',
    max_agents INT NOT NULL DEFAULT 10,         -- Sybil defense quota
    used_agents INT NOT NULL DEFAULT 0,         -- Current enrollment count
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Indexes for High-Performance Resolution
CREATE INDEX IF NOT EXISTS idx_aid_agent_aliases_full_address ON aid_agent_aliases(full_address);
CREATE INDEX IF NOT EXISTS idx_aid_agents_namespace ON aid_agents(namespace_id);
CREATE INDEX IF NOT EXISTS idx_aid_endpoints_agent ON aid_agent_endpoints(agent_id);
CREATE INDEX IF NOT EXISTS idx_aid_identity_events_agent ON aid_identity_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_aid_enrollment_tokens_hash ON aid_enrollment_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_aid_enrollment_tokens_ns ON aid_enrollment_tokens(namespace_id);

