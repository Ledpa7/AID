const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const top10 = [
  {
    ns: {
      id: "ns_01M9CURSOR01ANSPHERE",
      slug: "cursor",
      name: "Cursor AI",
      domain: "cursor.com",
    },
    agent: {
      id: "aid_01M9CURSOR01COMPOSER",
      alias: "composer",
      displayName: "Cursor Composer Agent",
      description:
        "Multi-file AI codebase editing and architecture refactoring engine. [COMMUNITY_LISTED] [CAT:Coding]",
      category: "Coding",
      endpointUrl: "https://api.cursor.com/v1/composer",
      protocol: "a2a",
    },
  },
  {
    ns: {
      id: "ns_01M9PERPLEXITY02AI",
      slug: "perplexity",
      name: "Perplexity AI",
      domain: "perplexity.ai",
    },
    agent: {
      id: "aid_01M9PERPLEXITY02SEARCH",
      alias: "search",
      displayName: "Perplexity Search Agent",
      description:
        "Real-time web research engine combining multi-source web indexing with academic citations. [COMMUNITY_LISTED] [CAT:Research]",
      category: "Research",
      endpointUrl: "https://api.perplexity.ai/search",
      protocol: "rest",
    },
  },
  {
    ns: {
      id: "ns_01M9DEVIN03COGNITION",
      slug: "devin",
      name: "Cognition AI",
      domain: "cognition.ai",
    },
    agent: {
      id: "aid_01M9DEVIN03SWEENGINEER",
      alias: "swe",
      displayName: "Cognition Devin Software Engineer",
      description:
        "Autonomous software engineering agent capable of planning, executing complex coding tasks, and debugging in sandboxed VMs. [COMMUNITY_LISTED] [CAT:Coding]",
      category: "Coding",
      endpointUrl: "https://api.cognition.ai/v1/devin",
      protocol: "a2a",
    },
  },
  {
    ns: {
      id: "ns_01M9VERCEL04V0SPACE",
      slug: "v0",
      name: "Vercel v0",
      domain: "v0.dev",
    },
    agent: {
      id: "aid_01M9VERCEL04UIENGINE",
      alias: "ui",
      displayName: "Vercel v0 Generative UI Agent",
      description:
        "Generative UI engine transforming natural language prompts into responsive React and Tailwind CSS components. [COMMUNITY_LISTED] [CAT:Design]",
      category: "Design",
      endpointUrl: "https://v0.dev/api/generate",
      protocol: "rest",
    },
  },
  {
    ns: {
      id: "ns_01M9CLAUDE05ANTHROPIC",
      slug: "claude",
      name: "Anthropic Claude",
      domain: "anthropic.com",
    },
    agent: {
      id: "aid_01M9CLAUDE05CODECLI",
      alias: "cli",
      displayName: "Claude Code CLI Agent",
      description:
        "Terminal-native agentic coding assistant for repository navigation, test suite execution, and git automation. [COMMUNITY_LISTED] [CAT:Coding]",
      category: "Coding",
      endpointUrl: "https://api.anthropic.com/v1/claude-code",
      protocol: "mcp",
    },
  },
  {
    ns: {
      id: "ns_01M9LOVABLE06BUILDER",
      slug: "lovable",
      name: "Lovable.dev",
      domain: "lovable.dev",
    },
    agent: {
      id: "aid_01M9LOVABLE06FULLSTACK",
      alias: "builder",
      displayName: "Lovable Full-Stack Builder Agent",
      description:
        "Prompt-to-production full-stack web builder generating Supabase backend schemas, authentication, and Next.js frontends. [COMMUNITY_LISTED] [CAT:Design]",
      category: "Design",
      endpointUrl: "https://api.lovable.dev/v1/builder",
      protocol: "a2a",
    },
  },
  {
    ns: {
      id: "ns_01M9BOLT07STACKBLITZ",
      slug: "bolt",
      name: "Bolt.new StackBlitz",
      domain: "bolt.new",
    },
    agent: {
      id: "aid_01M9BOLT07WEBCONTAINER",
      alias: "stack",
      displayName: "Bolt.new WebContainer Agent",
      description:
        "In-browser full-stack development agent powered by WebContainers for zero-setup Node.js sandbox execution. [COMMUNITY_LISTED] [CAT:Coding]",
      category: "Coding",
      endpointUrl: "https://bolt.new/api/agent",
      protocol: "rest",
    },
  },
  {
    ns: {
      id: "ns_01M9CONSENSUS08SCIENCE",
      slug: "consensus",
      name: "Consensus.app",
      domain: "consensus.app",
    },
    agent: {
      id: "aid_01M9CONSENSUS08RESEARCH",
      alias: "researcher",
      displayName: "Consensus Academic Research Agent",
      description:
        "AI search engine for science, extracting consensus insights and evidence from over 200 million peer-reviewed papers. [COMMUNITY_LISTED] [CAT:Research]",
      category: "Research",
      endpointUrl: "https://consensus.app/api/v1/search",
      protocol: "rest",
    },
  },
  {
    ns: {
      id: "ns_01M9CLOUDFLARE09EDGE",
      slug: "cloudflare",
      name: "Cloudflare Edge",
      domain: "cloudflare.com",
    },
    agent: {
      id: "aid_01M9CLOUDFLARE09SENTINEL",
      alias: "sentinel",
      displayName: "Cloudflare Edge Security Sentinel",
      description:
        "Global edge telemetry agent monitoring DDoS mitigation, zero-trust tunnels, and edge worker health across 300+ PoPs. [COMMUNITY_LISTED] [CAT:DevOps]",
      category: "DevOps",
      endpointUrl: "https://api.cloudflare.com/client/v4/sentinel",
      protocol: "rest",
    },
  },
  {
    ns: {
      id: "ns_01M9SPOTIFY10MUSIC",
      slug: "spotify",
      name: "Spotify AI",
      domain: "spotify.com",
    },
    agent: {
      id: "aid_01M9SPOTIFY10CURATOR",
      alias: "curator",
      displayName: "Spotify AI Playlist Curator",
      description:
        "Sonic intelligence agent generating hyper-personalized acoustic moodboards, flow-state audio, and algorithmic playlists. [COMMUNITY_LISTED] [CAT:Media]",
      category: "Media",
      endpointUrl: "https://api.spotify.com/v1/ai/curator",
      protocol: "rest",
    },
  },
];

async function seed() {
  console.log("Starting Top 10 Agent Seeding...");
  const now = new Date().toISOString();

  for (const item of top10) {
    // 1. Check or Insert Namespace
    const { data: existingNs } = await supabase
      .from("aid_namespaces")
      .select("id")
      .eq("slug", item.ns.slug)
      .maybeSingle();

    let nsId = existingNs?.id;
    if (!nsId) {
      const { data: insertedNs, error: nsErr } = await supabase
        .from("aid_namespaces")
        .insert({
          id: item.ns.id,
          slug: item.ns.slug,
          name: item.ns.name,
          domain: item.ns.domain,
          status: "CLAIMED",
          is_verified: false,
          created_at: now,
          updated_at: now,
        })
        .select("id")
        .single();

      if (nsErr) {
        console.error(`Error inserting namespace @${item.ns.slug}:`, nsErr);
        continue;
      }
      nsId = insertedNs.id;
      console.log(`+ Namespace @${item.ns.slug} created.`);
    }

    // 2. Check or Insert Agent
    const { data: existingAgent } = await supabase
      .from("aid_agents")
      .select("id")
      .eq("namespace_id", nsId)
      .eq("default_alias", item.agent.alias)
      .maybeSingle();

    let agentId = existingAgent?.id;
    if (!agentId) {
      const { data: insertedAgent, error: agentErr } = await supabase
        .from("aid_agents")
        .insert({
          id: item.agent.id,
          namespace_id: nsId,
          default_alias: item.agent.alias,
          display_name: item.agent.displayName,
          description: item.agent.description,
          visibility: "PUBLIC",
          status: "ACTIVE",
          created_at: now,
          updated_at: now,
        })
        .select("id")
        .single();

      if (agentErr) {
        console.error(`Error inserting agent ${item.agent.alias}:`, agentErr);
        continue;
      }
      agentId = insertedAgent.id;
      console.log(`+ Agent ${item.agent.alias}@${item.ns.slug} created.`);

      // 3. Insert Endpoint
      await supabase.from("aid_agent_endpoints").insert({
        id: `ep_${item.agent.id.replace("aid_", "")}`,
        agent_id: agentId,
        protocol: item.agent.protocol,
        url: item.agent.endpointUrl,
        is_primary: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      });

      // 4. Insert Alias
      await supabase.from("aid_agent_aliases").insert({
        id: `alias_${item.agent.id.replace("aid_", "")}`,
        agent_id: agentId,
        namespace_id: nsId,
        alias: item.agent.alias,
        full_address: `${item.agent.alias}@${item.ns.slug}`,
        is_primary: true,
        is_active: true,
        created_at: now,
      });

      // 5. Insert mock Ed25519 Key
      await supabase.from("aid_agent_keys").insert({
        id: `key_${item.agent.id.replace("aid_", "")}`,
        agent_id: agentId,
        key_type: "Ed25519",
        public_key: `ed25519:seeded_${item.agent.alias}_public_identity_key`,
        is_primary: true,
        is_revoked: false,
        created_at: now,
      });
    } else {
      console.log(`- Agent ${item.agent.alias}@${item.ns.slug} already exists.`);
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
