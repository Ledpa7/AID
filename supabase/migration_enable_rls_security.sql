-- ============================================================================
-- AID Supabase Security Patch: Enable RLS & Safe Access Policies
-- Execute this script in your Supabase Project -> SQL Editor -> Run
-- ============================================================================

-- 1. Enable Row Level Security (RLS) on all AID tables
ALTER TABLE aid_namespaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_agent_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_agent_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_agent_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_agent_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_identity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_domain_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_enrollment_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_agent_sparks ENABLE ROW LEVEL SECURITY;

-- 2. Clean up existing policies if any
DROP POLICY IF EXISTS "Public read for namespaces" ON aid_namespaces;
DROP POLICY IF EXISTS "Public read for agents" ON aid_agents;
DROP POLICY IF EXISTS "Public read for aliases" ON aid_agent_aliases;
DROP POLICY IF EXISTS "Public read for endpoints" ON aid_agent_endpoints;
DROP POLICY IF EXISTS "Public read for cards" ON aid_agent_cards;
DROP POLICY IF EXISTS "Public read for keys" ON aid_agent_keys;
DROP POLICY IF EXISTS "Public read for sparks" ON aid_agent_sparks;

-- 3. Allow Public Read (SELECT) for Directory & Discovery
CREATE POLICY "Public read for namespaces" ON aid_namespaces FOR SELECT USING (true);
CREATE POLICY "Public read for agents" ON aid_agents FOR SELECT USING (true);
CREATE POLICY "Public read for aliases" ON aid_agent_aliases FOR SELECT USING (true);
CREATE POLICY "Public read for endpoints" ON aid_agent_endpoints FOR SELECT USING (true);
CREATE POLICY "Public read for cards" ON aid_agent_cards FOR SELECT USING (true);
CREATE POLICY "Public read for keys" ON aid_agent_keys FOR SELECT USING (true);
CREATE POLICY "Public read for sparks" ON aid_agent_sparks FOR SELECT USING (true);

-- 4. Sensitive tables (aid_api_keys, aid_enrollment_tokens, aid_domain_verifications, aid_identity_events)
-- No public SELECT policies are granted, which means public anon clients cannot read them.
-- Only the backend server (using SUPABASE_SERVICE_ROLE_KEY) can access them.
