-- ============================================================================
-- AID Supabase Security Patch: Safe Conditional RLS & Access Policies
-- Execute this script in your Supabase Project -> SQL Editor -> Run
-- ============================================================================

-- 1. Ensure enrollment tokens table exists if missing
CREATE TABLE IF NOT EXISTS aid_enrollment_tokens (
    id TEXT PRIMARY KEY,
    namespace_id TEXT NOT NULL REFERENCES aid_namespaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    token_prefix TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{"agent:create"}',
    max_agents INT NOT NULL DEFAULT 10,
    used_agents INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Safely Enable RLS only on tables that actually exist in the database
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'aid_namespaces',
        'aid_agents',
        'aid_agent_aliases',
        'aid_agent_endpoints',
        'aid_agent_cards',
        'aid_agent_keys',
        'aid_identity_events',
        'aid_domain_verifications',
        'aid_api_keys',
        'aid_enrollment_tokens',
        'aid_agent_sparks'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        END IF;
    END LOOP;
END $$;

-- 3. Safely apply Public Read (SELECT) policies for existing public tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'aid_namespaces') THEN
        DROP POLICY IF EXISTS "Public read for namespaces" ON aid_namespaces;
        CREATE POLICY "Public read for namespaces" ON aid_namespaces FOR SELECT USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'aid_agents') THEN
        DROP POLICY IF EXISTS "Public read for agents" ON aid_agents;
        CREATE POLICY "Public read for agents" ON aid_agents FOR SELECT USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'aid_agent_aliases') THEN
        DROP POLICY IF EXISTS "Public read for aliases" ON aid_agent_aliases;
        CREATE POLICY "Public read for aliases" ON aid_agent_aliases FOR SELECT USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'aid_agent_endpoints') THEN
        DROP POLICY IF EXISTS "Public read for endpoints" ON aid_agent_endpoints;
        CREATE POLICY "Public read for endpoints" ON aid_agent_endpoints FOR SELECT USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'aid_agent_cards') THEN
        DROP POLICY IF EXISTS "Public read for cards" ON aid_agent_cards;
        CREATE POLICY "Public read for cards" ON aid_agent_cards FOR SELECT USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'aid_agent_keys') THEN
        DROP POLICY IF EXISTS "Public read for keys" ON aid_agent_keys;
        CREATE POLICY "Public read for keys" ON aid_agent_keys FOR SELECT USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'aid_agent_sparks') THEN
        DROP POLICY IF EXISTS "Public read for sparks" ON aid_agent_sparks;
        CREATE POLICY "Public read for sparks" ON aid_agent_sparks FOR SELECT USING (true);
    END IF;
END $$;
