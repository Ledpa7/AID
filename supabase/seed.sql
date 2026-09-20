-- ==========================================
-- AID Guide Sample Data & RLS Setup
-- Run this in Supabase SQL Editor to enable public access and populate real rows
-- ==========================================

-- 1. RLS(Row Level Security) 접근 허용 (AID 오픈 레지스트리용)
ALTER TABLE aid_namespaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE aid_agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE aid_agent_aliases DISABLE ROW LEVEL SECURITY;
ALTER TABLE aid_agent_endpoints DISABLE ROW LEVEL SECURITY;
ALTER TABLE aid_agent_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE aid_agent_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE aid_identity_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE aid_domain_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE aid_api_keys DISABLE ROW LEVEL SECURITY;

-- 2. 가이드 네임스페이스 (@aid, @community, @github)
INSERT INTO aid_namespaces (id, slug, name, domain, status, is_verified, verified_at, created_at, updated_at)
VALUES 
  ('ns_01K72M8KQ4AIDROOT', 'aid', 'AID Protocol Foundation', 'aid-beryl.vercel.app', 'CLAIMED', TRUE, NOW(), NOW(), NOW()),
  ('ns_01K72M8KQ4COMMUNITY', 'community', 'Autonomous Agent Ecosystem', 'aid-beryl.vercel.app', 'CLAIMED', TRUE, NOW(), NOW(), NOW()),
  ('ns_01M30DVVY1E8QFP99G70ZVGQ53', 'github', 'GitHub Ecosystem', 'github.com', 'CLAIMED', TRUE, NOW(), NOW(), NOW())
ON CONFLICT (slug) DO UPDATE 
SET is_verified = TRUE, updated_at = NOW();

-- 3. 가이드 에이전트 (registry@aid, oracle@community, scout@github)
INSERT INTO aid_agents (id, namespace_id, default_alias, display_name, description, visibility, status, created_at, updated_at)
VALUES
  ('aid_01K72M8KQ4GENESIS01', 'ns_01K72M8KQ4AIDROOT', 'registry', 'AID Global Registry Agent', 'Core identity resolution & agent discovery protocol agent.', 'PUBLIC', 'ACTIVE', NOW(), NOW()),
  ('aid_01K72M8KQ4GENESIS02', 'ns_01K72M8KQ4COMMUNITY', 'oracle', 'Decentralized Verification Oracle', 'Cryptographic proof verification and trust evidence evaluator.', 'PUBLIC', 'ACTIVE', NOW(), NOW()),
  ('aid_01M30DW5MS43TTBR0BBS3KRSZ4', 'ns_01M30DVVY1E8QFP99G70ZVGQ53', 'scout', 'GitHub Scout Agent (Vibe Coder Edition)', 'Autonomous open-source research agent for vibe coders. Discovers curated AI boilerplates, extracts verified README docs to eliminate LLM hallucinations, and audits package dependencies in real time.', 'PUBLIC', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET display_name = EXCLUDED.display_name, updated_at = NOW();

-- 4. 인간 친화 주소 매핑
INSERT INTO aid_agent_aliases (id, agent_id, namespace_id, alias, full_address, is_primary, is_active, created_at)
VALUES
  ('alias_01K72M8KQ4GENESIS01', 'aid_01K72M8KQ4GENESIS01', 'ns_01K72M8KQ4AIDROOT', 'registry', 'registry@aid', TRUE, TRUE, NOW()),
  ('alias_01K72M8KQ4GENESIS02', 'aid_01K72M8KQ4GENESIS02', 'ns_01K72M8KQ4COMMUNITY', 'oracle', 'oracle@community', TRUE, TRUE, NOW()),
  ('alias_01M30DW5MS43TTBR0BBS3KRSZ4', 'aid_01M30DW5MS43TTBR0BBS3KRSZ4', 'ns_01M30DVVY1E8QFP99G70ZVGQ53', 'scout', 'scout@github', TRUE, TRUE, NOW())
ON CONFLICT (full_address) DO NOTHING;

-- 5. 통신 엔드포인트 (MCP & REST & A2A)
INSERT INTO aid_agent_endpoints (id, agent_id, protocol, url, is_primary, is_active, created_at, updated_at)
VALUES
  ('ep_01K72M8KQ4EP01', 'aid_01K72M8KQ4GENESIS01', 'mcp', 'https://aid-beryl.vercel.app/bin/aid-mcp.js', TRUE, TRUE, NOW(), NOW()),
  ('ep_01K72M8KQ4EP02', 'aid_01K72M8KQ4GENESIS02', 'a2a', 'https://aid-beryl.vercel.app/api/v1/resolve/oracle@community', TRUE, TRUE, NOW(), NOW()),
  ('ep_01M30DW5MSQC3HMA9BW69FVQ7T', 'aid_01M30DW5MS43TTBR0BBS3KRSZ4', 'rest', 'https://aid-beryl.vercel.app/api/agents/github', TRUE, TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. 암호학적 공개키 (Ed25519)
INSERT INTO aid_agent_keys (id, agent_id, key_type, public_key, is_primary, is_revoked, created_at)
VALUES
  ('key_01K72M8KQ4KEY01', 'aid_01K72M8KQ4GENESIS01', 'Ed25519', 'ed25519:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069', TRUE, FALSE, NOW()),
  ('key_01K72M8KQ4KEY02', 'aid_01K72M8KQ4GENESIS02', 'Ed25519', 'ed25519:8a93b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9123', TRUE, FALSE, NOW()),
  ('key_01M30DW5MS43TTBR0BBS3KRSZ4', 'aid_01M30DW5MS43TTBR0BBS3KRSZ4', 'Ed25519', 'ed25519:6c91a32b0f44e26f59c2598379c1d65dfc2d4b1fa3d677284addd200126d8888', TRUE, FALSE, NOW())
ON CONFLICT (id) DO NOTHING;

-- 7. 초기 생성 감사 로그 (SHA-256 해시)
INSERT INTO aid_identity_events (agent_id, event_type, payload, event_hash, created_at)
VALUES
  ('aid_01K72M8KQ4GENESIS01', 'AGENT_CREATED', '{"address": "registry@aid", "endpoint": "https://aid-beryl.vercel.app/bin/aid-mcp.js"}', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', NOW()),
  ('aid_01K72M8KQ4GENESIS02', 'AGENT_CREATED', '{"address": "oracle@community", "endpoint": "https://aid-beryl.vercel.app/api/v1/resolve/oracle@community"}', 'cb8379ac2098aa165029e3938a51da0bcecfc008fd6795f401178647f96c5b34', NOW()),
  ('aid_01M30DW5MS43TTBR0BBS3KRSZ4', 'AGENT_CREATED', '{"address": "scout@github", "endpoint": "https://aid-beryl.vercel.app/api/agents/github"}', 'a7e04f98124b6118d350813ba24f46cb6104bc1b0922849e89d136934c935402', NOW())
ON CONFLICT DO NOTHING;
