-- ==========================================
-- AID Production Seed Data
-- Run this in Supabase SQL Editor to populate initial real database rows
-- ==========================================

-- 1. Initial Verified Namespaces (@aid, @community)
INSERT INTO aid_namespaces (id, slug, name, domain, status, is_verified, verified_at, created_at, updated_at)
VALUES 
  ('ns_01K72M8KQ4AIDROOT', 'aid', 'AID Protocol Foundation', 'aid-beryl.vercel.app', 'CLAIMED', TRUE, NOW(), NOW(), NOW()),
  ('ns_01K72M8KQ4COMMUNITY', 'community', 'Autonomous Agent Ecosystem', 'aid-beryl.vercel.app', 'CLAIMED', TRUE, NOW(), NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 2. Initial Real Agents (registry@aid, oracle@community)
INSERT INTO aid_agents (id, namespace_id, default_alias, display_name, description, visibility, status, created_at, updated_at)
VALUES
  ('aid_01K72M8KQ4GENESIS01', 'ns_01K72M8KQ4AIDROOT', 'registry', 'AID Global Registry Agent', 'Core identity resolution & agent discovery protocol agent.', 'PUBLIC', 'ACTIVE', NOW(), NOW()),
  ('aid_01K72M8KQ4GENESIS02', 'ns_01K72M8KQ4COMMUNITY', 'oracle', 'Decentralized Verification Oracle', 'Cryptographic proof verification and trust evidence evaluator.', 'PUBLIC', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Human-readable Aliases
INSERT INTO aid_agent_aliases (id, agent_id, namespace_id, alias, full_address, is_primary, is_active, created_at)
VALUES
  ('alias_01K72M8KQ4GENESIS01', 'aid_01K72M8KQ4GENESIS01', 'ns_01K72M8KQ4AIDROOT', 'registry', 'registry@aid', TRUE, TRUE, NOW()),
  ('alias_01K72M8KQ4GENESIS02', 'aid_01K72M8KQ4GENESIS02', 'ns_01K72M8KQ4COMMUNITY', 'oracle', 'oracle@community', TRUE, TRUE, NOW())
ON CONFLICT (full_address) DO NOTHING;

-- 4. Communication Endpoints (MCP & A2A)
INSERT INTO aid_agent_endpoints (id, agent_id, protocol, url, is_primary, is_active, created_at, updated_at)
VALUES
  ('ep_01K72M8KQ4EP01', 'aid_01K72M8KQ4GENESIS01', 'mcp', 'https://aid-beryl.vercel.app/bin/aid-mcp.js', TRUE, TRUE, NOW(), NOW()),
  ('ep_01K72M8KQ4EP02', 'aid_01K72M8KQ4GENESIS02', 'a2a', 'https://aid-beryl.vercel.app/api/v1/resolve/oracle@community', TRUE, TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Cryptographic Public Keys (Ed25519)
INSERT INTO aid_agent_keys (id, agent_id, key_type, public_key, is_primary, is_revoked, created_at)
VALUES
  ('key_01K72M8KQ4KEY01', 'aid_01K72M8KQ4GENESIS01', 'Ed25519', 'ed25519:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069', TRUE, FALSE, NOW()),
  ('key_01K72M8KQ4KEY02', 'aid_01K72M8KQ4GENESIS02', 'Ed25519', 'ed25519:8a93b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9123', TRUE, FALSE, NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. Genesis Audit Log
INSERT INTO aid_identity_events (agent_id, event_type, payload, event_hash, created_at)
VALUES
  ('aid_01K72M8KQ4GENESIS01', 'AGENT_CREATED', '{"address": "registry@aid", "endpoint": "https://aid-beryl.vercel.app/bin/aid-mcp.js"}', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', NOW()),
  ('aid_01K72M8KQ4GENESIS02', 'AGENT_CREATED', '{"address": "oracle@community", "endpoint": "https://aid-beryl.vercel.app/api/v1/resolve/oracle@community"}', 'cb8379ac2098aa165029e3938a51da0bcecfc008fd6795f401178647f96c5b34', NOW())
ON CONFLICT DO NOTHING;
