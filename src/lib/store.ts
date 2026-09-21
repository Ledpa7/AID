import { createClient } from "@supabase/supabase-js";
import { Namespace, Agent, ResolutionResponse, AgentEndpoint } from "./types";
import {
  generateAID,
  generateEndpointId,
  generateNamespaceId,
  generateKeyId,
} from "./ulid";
import crypto from "crypto";
import {
  verifyDnsTxtRecord,
  generateDomainChallengeToken,
  sanitizeDomain,
} from "./dns";

// Pure fallback store for offline/local development
const globalStore: {
  namespaces: Namespace[];
  agents: Agent[];
} = {
  namespaces: [
    {
      id: "ns_01K72M8KQ4AIDROOT",
      slug: "aid",
      name: "AID Protocol Foundation",
      domain: "aid-beryl.vercel.app",
      status: "CLAIMED",
      isVerified: true,
      verifiedAt: "2026-09-19T08:09:48.303708+00:00",
      createdAt: "2026-09-19T08:09:48.303708+00:00",
      updatedAt: "2026-09-19T08:42:02.452686+00:00",
    },
    {
      id: "ns_01K72M8KQ4COMMUNITY",
      slug: "community",
      name: "Autonomous Agent Ecosystem",
      domain: "aid-beryl.vercel.app",
      status: "CLAIMED",
      isVerified: true,
      verifiedAt: "2026-09-19T08:09:48.303708+00:00",
      createdAt: "2026-09-19T08:09:48.303708+00:00",
      updatedAt: "2026-09-19T08:42:02.452686+00:00",
    },
    {
      id: "ns_01M30DVVY1E8QFP99G70ZVGQ53",
      slug: "github",
      name: "GitHub Ecosystem",
      domain: "github.com",
      status: "CLAIMED",
      isVerified: true,
      verifiedAt: "2026-09-20T22:09:25.442Z",
      createdAt: "2026-09-20T22:09:25.442Z",
      updatedAt: "2026-09-20T22:09:25.442Z",
    },
  ],
  agents: [
    {
      id: "aid_01M30DW5MS43TTBR0BBS3KRSZ4",
      namespaceId: "ns_01M30DVVY1E8QFP99G70ZVGQ53",
      namespaceSlug: "github",
      defaultAlias: "scout",
      displayName: "GitHub Scout Agent (Vibe Coder Edition)",
      description:
        "Autonomous open-source research agent for vibe coders. Discovers curated AI boilerplates, extracts verified README docs to eliminate LLM hallucinations, and audits package dependencies in real time.",
      visibility: "PUBLIC",
      status: "ACTIVE",
      primaryAddress: "scout@github",
      endpoints: [
        {
          id: "ep_01M30DW5MSQC3HMA9BW69FVQ7T",
          agentId: "aid_01M30DW5MS43TTBR0BBS3KRSZ4",
          protocol: "rest",
          url: "https://aid-beryl.vercel.app/api/agents/github",
          isPrimary: true,
          isActive: true,
          createdAt: "2026-09-20T22:09:35.385Z",
        },
      ],
      publicKey: "ed25519:6c91a32b0f44e26f59c2598379c1d65dfc2d4b1fa3d677284addd200126d8888",
      isDomainVerified: true,
      isKeyVerified: true,
      createdAt: "2026-09-20T22:09:35.385Z",
      updatedAt: "2026-09-20T22:09:35.385Z",
    },
    {
      id: "aid_01K72M8KQ4GENESIS01",
      namespaceId: "ns_01K72M8KQ4AIDROOT",
      namespaceSlug: "aid",
      defaultAlias: "registry",
      displayName: "AID Global Registry Agent",
      description: "Core identity resolution & agent discovery protocol agent.",
      visibility: "PUBLIC",
      status: "ACTIVE",
      primaryAddress: "registry@aid",
      endpoints: [
        {
          id: "ep_01K72M8KQ4EP01",
          agentId: "aid_01K72M8KQ4GENESIS01",
          protocol: "mcp",
          url: "https://aid-beryl.vercel.app/bin/aid-mcp.js",
          isPrimary: true,
          isActive: true,
          createdAt: "2026-09-19T08:09:48.303708+00:00",
        },
      ],
      publicKey: "ed25519:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      isDomainVerified: true,
      isKeyVerified: true,
      createdAt: "2026-09-19T08:09:48.303708+00:00",
      updatedAt: "2026-09-19T08:42:02.452686+00:00",
    },
    {
      id: "aid_01K72M8KQ4GENESIS02",
      namespaceId: "ns_01K72M8KQ4COMMUNITY",
      namespaceSlug: "community",
      defaultAlias: "oracle",
      displayName: "Decentralized Verification Oracle",
      description: "Cryptographic proof verification and trust evidence evaluator.",
      visibility: "PUBLIC",
      status: "ACTIVE",
      primaryAddress: "oracle@community",
      endpoints: [
        {
          id: "ep_01K72M8KQ4EP02",
          agentId: "aid_01K72M8KQ4GENESIS02",
          protocol: "a2a",
          url: "https://aid-beryl.vercel.app/api/v1/resolve/oracle@community",
          isPrimary: true,
          isActive: true,
          createdAt: "2026-09-19T08:09:48.303708+00:00",
        },
      ],
      publicKey: "ed25519:8a93b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9123",
      isDomainVerified: true,
      isKeyVerified: true,
      createdAt: "2026-09-19T08:09:48.303708+00:00",
      updatedAt: "2026-09-19T08:42:02.452686+00:00",
    },
  ],
};

export class AIDStore {
  private static getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key && !url.includes("your-project")) {
      return createClient(url, key);
    }
    return null;
  }

  // --- Namespaces ---
  static async getNamespaces(): Promise<Namespace[]> {
    const supabase = this.getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("aid_namespaces")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Supabase error fetching namespaces:", error);
        return [];
      }

      return (data || []).map((d: any) => ({
        id: d.id,
        slug: d.slug,
        name: d.name,
        ownerId: d.owner_id,
        domain: d.domain,
        status: d.status,
        isVerified: d.is_verified,
        verifiedAt: d.verified_at,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return globalStore.namespaces;
  }

  static async findNamespaceBySlug(slug: string): Promise<Namespace | null> {
    const normalized = slug.replace(/^@/, "").toLowerCase();
    const supabase = this.getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("aid_namespaces")
        .select("*")
        .eq("slug", normalized)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        slug: data.slug,
        name: data.name,
        ownerId: data.owner_id,
        domain: data.domain,
        status: data.status,
        isVerified: data.is_verified,
        verifiedAt: data.verified_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
    return (
      globalStore.namespaces.find((ns) => ns.slug.toLowerCase() === normalized) || null
    );
  }

  static async createNamespace(
    slug: string,
    name: string,
    domain?: string
  ): Promise<Namespace> {
    const normalized = slug.replace(/^@/, "").toLowerCase();
    const existing = await this.findNamespaceBySlug(normalized);
    if (existing) {
      throw new Error(`Namespace @${normalized} is already claimed.`);
    }

    const newNs: Namespace = {
      id: generateNamespaceId(),
      slug: normalized,
      name,
      domain,
      status: "CLAIMED",
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const supabase = this.getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from("aid_namespaces").insert({
        id: newNs.id,
        slug: newNs.slug,
        name: newNs.name,
        domain: newNs.domain,
        status: newNs.status,
        is_verified: newNs.isVerified,
        created_at: newNs.createdAt,
        updated_at: newNs.updatedAt,
      });
      if (error) {
        throw new Error(`Failed to save namespace to Supabase: ${error.message}`);
      }
    } else {
      globalStore.namespaces.push(newNs);
    }

    return newNs;
  }

  // --- Domain Verification ---
  static async getDomainChallenge(slug: string) {
    const ns = await this.findNamespaceBySlug(slug);
    if (!ns) {
      throw new Error(`Namespace @${slug} not found.`);
    }

    if (!ns.domain) {
      throw new Error(`Namespace @${slug} does not have an associated domain.`);
    }

    const cleanDomain = sanitizeDomain(ns.domain);
    const expectedToken = generateDomainChallengeToken(ns.slug, cleanDomain);

    const supabase = this.getSupabaseClient();
    if (supabase) {
      // Check existing verification record
      const { data: existing } = await supabase
        .from("aid_domain_verifications")
        .select("*")
        .eq("namespace_id", ns.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!existing) {
        // Create verification challenge record
        await supabase.from("aid_domain_verifications").insert({
          id: `dver_${ns.id.replace(/^ns_/, "")}`,
          namespace_id: ns.id,
          domain: cleanDomain,
          challenge_token: expectedToken,
          status: ns.isVerified ? "VERIFIED" : "PENDING",
          verified_at: ns.verifiedAt || null,
          created_at: new Date().toISOString(),
        });
      }
    }

    return {
      slug: ns.slug,
      name: ns.name,
      domain: cleanDomain,
      isVerified: ns.isVerified,
      verifiedAt: ns.verifiedAt,
      challengeToken: expectedToken,
      dnsRecord: {
        type: "TXT",
        host: `_aid.${cleanDomain}`,
        name: "_aid",
        value: expectedToken,
        rootHost: cleanDomain,
      },
    };
  }

  static async verifyDomain(slug: string) {
    const challenge = await this.getDomainChallenge(slug);

    if (challenge.isVerified) {
      return {
        success: true,
        alreadyVerified: true,
        message: `Domain '${challenge.domain}' is already verified for namespace @${challenge.slug}.`,
        domain: challenge.domain,
        verifiedAt: challenge.verifiedAt,
      };
    }

    // Run real-time DNS TXT query via Google / Cloudflare
    const dnsResult = await verifyDnsTxtRecord(challenge.domain, challenge.challengeToken);

    if (!dnsResult.success) {
      return {
        success: false,
        error: dnsResult.error,
        domain: challenge.domain,
        queriedHosts: dnsResult.queriedHosts,
        recordsFound: dnsResult.recordsFound,
      };
    }

    // Update database states
    const now = new Date().toISOString();
    const supabase = this.getSupabaseClient();
    if (supabase) {
      const ns = await this.findNamespaceBySlug(slug);
      if (ns) {
        // 1. Update aid_namespaces
        await supabase
          .from("aid_namespaces")
          .update({
            is_verified: true,
            verified_at: now,
            updated_at: now,
          })
          .eq("id", ns.id);

        // 2. Update aid_domain_verifications
        await supabase
          .from("aid_domain_verifications")
          .update({
            status: "VERIFIED",
            verified_at: now,
          })
          .eq("namespace_id", ns.id);

        // 3. Append to Audit log
        const eventHash = crypto
          .createHash("sha256")
          .update(`${ns.id}:DOMAIN_VERIFIED:${now}`)
          .digest("hex");

        await supabase.from("aid_identity_events").insert({
          agent_id: ns.id,
          event_type: "DOMAIN_VERIFIED",
          payload: {
            slug: ns.slug,
            domain: challenge.domain,
            matchedRecord: dnsResult.matchedRecord,
          },
          event_hash: eventHash,
        });
      }
    } else {
      // In-memory fallback
      const localNs = globalStore.namespaces.find((n) => n.slug === challenge.slug);
      if (localNs) {
        localNs.isVerified = true;
        localNs.verifiedAt = now;
      }
    }

    return {
      success: true,
      domain: challenge.domain,
      matchedRecord: dnsResult.matchedRecord,
      verifiedAt: now,
    };
  }

  // --- Agents ---
  static async getAgents(): Promise<Agent[]> {
    const supabase = this.getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("aid_agents")
        .select(
          `
          *,
          aid_namespaces(slug, is_verified),
          aid_agent_endpoints(*),
          aid_agent_keys(*)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error fetching agents:", error);
        return [];
      }

      return (data || []).map((d: any) => {
        const endpoints: AgentEndpoint[] = (d.aid_agent_endpoints || []).map(
          (ep: any) => ({
            id: ep.id,
            agentId: ep.agent_id,
            protocol: ep.protocol,
            url: ep.url,
            isPrimary: ep.is_primary,
            isActive: ep.is_active,
            createdAt: ep.created_at,
          })
        );
        const primaryKey = (d.aid_agent_keys || []).find(
          (k: any) => k.is_primary && !k.is_revoked
        );
        const nsSlug = d.aid_namespaces?.slug || d.namespace_id;
        const isDomainVerified = !!d.aid_namespaces?.is_verified;

        return {
          id: d.id,
          namespaceId: d.namespace_id,
          namespaceSlug: nsSlug,
          defaultAlias: d.default_alias,
          displayName: d.display_name,
          description: d.description,
          visibility: d.visibility,
          status: d.status,
          primaryAddress: `${d.default_alias}@${nsSlug}`,
          endpoints,
          publicKey: primaryKey?.public_key,
          isDomainVerified,
          isKeyVerified: !!primaryKey,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        };
      });
    }
    return globalStore.agents;
  }

  static async findAgentByAID(aid: string): Promise<Agent | null> {
    const trimmed = (aid || "").trim();
    if (!trimmed) return null;

    const supabase = this.getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("aid_agents")
        .select(
          `
          *,
          aid_namespaces(slug, domain, is_verified),
          aid_agent_endpoints(*),
          aid_agent_keys(*)
        `
        )
        .ilike("id", trimmed)
        .maybeSingle();

      if (error || !data) return null;

      const endpoints: AgentEndpoint[] = (data.aid_agent_endpoints || []).map(
        (ep: any) => ({
          id: ep.id,
          agentId: ep.agent_id,
          protocol: ep.protocol,
          url: ep.url,
          isPrimary: ep.is_primary,
          isActive: ep.is_active,
          createdAt: ep.created_at,
        })
      );
      const primaryKey = (data.aid_agent_keys || []).find(
        (k: any) => k.is_primary && !k.is_revoked
      );
      const nsSlug = data.aid_namespaces?.slug || data.namespace_id;
      return {
        id: data.id,
        namespaceId: data.namespace_id,
        namespaceSlug: nsSlug,
        namespaceDomain: data.aid_namespaces?.domain,
        defaultAlias: data.default_alias,
        displayName: data.display_name,
        description: data.description,
        visibility: data.visibility,
        status: data.status,
        primaryAddress: `${data.default_alias}@${nsSlug}`,
        endpoints,
        publicKey: primaryKey?.public_key,
        isDomainVerified: !!data.aid_namespaces?.is_verified,
        isKeyVerified: !!primaryKey,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
    return (
      globalStore.agents.find(
        (a) => a.id.toLowerCase() === trimmed.toLowerCase()
      ) || null
    );
  }

  private static async buildResolutionResponse(agent: Agent): Promise<ResolutionResponse> {
    const domain =
      agent.namespaceDomain ||
      (await this.findNamespaceBySlug(agent.namespaceSlug))?.domain;
    const primaryEndpoint =
      agent.endpoints.find((ep) => ep.isPrimary) || agent.endpoints[0];

    return {
      aid: agent.id,
      address: agent.primaryAddress,
      status: agent.status,
      visibility: agent.visibility,
      namespace: {
        slug: agent.namespaceSlug,
        domain,
        isVerified: agent.isDomainVerified,
      },
      endpoints: agent.endpoints.map((ep) => ({
        protocol: ep.protocol,
        url: ep.url,
        isPrimary: ep.isPrimary,
      })),
      primaryEndpoint: primaryEndpoint
        ? { protocol: primaryEndpoint.protocol, url: primaryEndpoint.url }
        : undefined,
      verification: {
        domain: agent.isDomainVerified,
        key: agent.isKeyVerified,
        card: !!agent.cardSnapshot,
      },
      capabilities: agent.cardSnapshot?.snapshotJson?.capabilities || [
        "web.search",
        "a2a.query",
      ],
      publicKey: agent.publicKey,
      resolvedAt: new Date().toISOString(),
    };
  }

  static async resolveAddress(address: string): Promise<ResolutionResponse | null> {
    const trimmed = (address || "").trim();
    if (!trimmed) return null;

    // 1. Direct AID Reverse Lookup (e.g. aid_01M30DW5MS43TTBR0BBS3KRSZ4)
    if (trimmed.toLowerCase().startsWith("aid_")) {
      const agent = await this.findAgentByAID(trimmed);
      if (agent) {
        return this.buildResolutionResponse(agent);
      }
      return null;
    }

    // 2. Handle Lookup (e.g. scout@github)
    const raw = trimmed.toLowerCase();
    const [aliasPart, namespacePart] = raw.split("@");
    if (!aliasPart || !namespacePart) return null;

    const supabase = this.getSupabaseClient();
    if (supabase) {
      // Optimized 1-step join query: fetches alias + agent + namespace + endpoints + keys in a single round-trip
      const { data: aliasData } = await supabase
        .from("aid_agent_aliases")
        .select(`
          full_address,
          aid_agents (
            *,
            aid_namespaces (slug, domain, is_verified),
            aid_agent_endpoints (*),
            aid_agent_keys (*)
          )
        `)
        .eq("full_address", `${aliasPart}@${namespacePart}`)
        .eq("is_active", true)
        .maybeSingle();

      if (!aliasData || !aliasData.aid_agents) {
        return null;
      }

      const agentData = aliasData.aid_agents as any;
        const endpoints: AgentEndpoint[] = (agentData.aid_agent_endpoints || []).map(
          (ep: any) => ({
            id: ep.id,
            agentId: ep.agent_id,
            protocol: ep.protocol,
            url: ep.url,
            isPrimary: ep.is_primary,
            isActive: ep.is_active,
            createdAt: ep.created_at,
          })
        );
        const primaryKey = (agentData.aid_agent_keys || []).find(
          (k: any) => k.is_primary && !k.is_revoked
        );
        const nsSlug = agentData.aid_namespaces?.slug || agentData.namespace_id;
        const agent: Agent = {
          id: agentData.id,
          namespaceId: agentData.namespace_id,
          namespaceSlug: nsSlug,
          namespaceDomain: agentData.aid_namespaces?.domain,
          defaultAlias: agentData.default_alias,
          displayName: agentData.display_name,
          description: agentData.description,
          visibility: agentData.visibility,
          status: agentData.status,
          primaryAddress: aliasData.full_address || `${agentData.default_alias}@${nsSlug}`,
          endpoints,
          publicKey: primaryKey?.public_key,
          isDomainVerified: !!agentData.aid_namespaces?.is_verified,
          isKeyVerified: !!primaryKey,
          createdAt: agentData.created_at,
          updatedAt: agentData.updated_at,
        };
        return this.buildResolutionResponse(agent);
      }

    // In-memory fallback (only when offline / no Supabase env)
    const agent = globalStore.agents.find(
      (a) =>
        a.primaryAddress.toLowerCase() === `${aliasPart}@${namespacePart}` ||
        (a.defaultAlias.toLowerCase() === aliasPart &&
          a.namespaceSlug.toLowerCase() === namespacePart)
    );

    if (!agent) return null;

    return this.buildResolutionResponse(agent);
  }

  static async registerAgent(params: {
    namespaceSlug: string;
    alias: string;
    displayName: string;
    description?: string;
    endpointUrl: string;
    protocol?: "a2a" | "mcp" | "rest";
    publicKey?: string;
    cardSnapshot?: any;
  }): Promise<Agent> {
    const ns = await this.findNamespaceBySlug(params.namespaceSlug);
    if (!ns) {
      throw new Error(`Namespace @${params.namespaceSlug} does not exist. Please create the namespace first.`);
    }

    const fullAddress = `${params.alias.toLowerCase()}@${ns.slug}`;
    const existing = await this.resolveAddress(fullAddress);
    if (existing) {
      throw new Error(`Address ${fullAddress} is already registered.`);
    }

    const aid = generateAID();
    const endpointId = generateEndpointId();
    const aliasId = `alias_${aid.replace("aid_", "")}`;

    const newAgent: Agent = {
      id: aid,
      namespaceId: ns.id,
      namespaceSlug: ns.slug,
      defaultAlias: params.alias.toLowerCase(),
      displayName: params.displayName,
      description: params.description,
      visibility: "PUBLIC",
      status: "ACTIVE",
      primaryAddress: fullAddress,
      endpoints: [
        {
          id: endpointId,
          agentId: aid,
          protocol: params.protocol || "a2a",
          url: params.endpointUrl,
          isPrimary: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ],
      publicKey: params.publicKey,
      cardSnapshot: params.cardSnapshot,
      isDomainVerified: ns.isVerified,
      isKeyVerified: !!params.publicKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const supabase = this.getSupabaseClient();
    if (supabase) {
      // 1. Insert Agent
      const { error: agentErr } = await supabase.from("aid_agents").insert({
        id: newAgent.id,
        namespace_id: ns.id,
        default_alias: newAgent.defaultAlias,
        display_name: newAgent.displayName,
        description: newAgent.description,
        visibility: newAgent.visibility,
        status: newAgent.status,
        created_at: newAgent.createdAt,
        updated_at: newAgent.updatedAt,
      });
      if (agentErr) throw new Error(`Supabase error inserting agent: ${agentErr.message}`);

      // 2. Insert Alias
      await supabase.from("aid_agent_aliases").insert({
        id: aliasId,
        agent_id: newAgent.id,
        namespace_id: ns.id,
        alias: newAgent.defaultAlias,
        full_address: fullAddress,
        is_primary: true,
        is_active: true,
        created_at: newAgent.createdAt,
      });

      // 3. Insert Endpoint
      await supabase.from("aid_agent_endpoints").insert({
        id: endpointId,
        agent_id: newAgent.id,
        protocol: params.protocol || "a2a",
        url: params.endpointUrl,
        is_primary: true,
        is_active: true,
        created_at: newAgent.createdAt,
        updated_at: newAgent.updatedAt,
      });

      // 4. Insert Public Key (if provided)
      if (params.publicKey) {
        await supabase.from("aid_agent_keys").insert({
          id: generateKeyId(),
          agent_id: newAgent.id,
          key_type: "Ed25519",
          public_key: params.publicKey,
          is_primary: true,
          is_revoked: false,
          created_at: newAgent.createdAt,
        });
      }

      // 5. Append-only Audit Log
      const eventHash = crypto
        .createHash("sha256")
        .update(`${newAgent.id}:AGENT_CREATED:${newAgent.createdAt}`)
        .digest("hex");

      await supabase.from("aid_identity_events").insert({
        agent_id: newAgent.id,
        event_type: "AGENT_CREATED",
        payload: { address: fullAddress, endpoint: params.endpointUrl },
        event_hash: eventHash,
      });
    } else {
      globalStore.agents.unshift(newAgent);
    }

    return newAgent;
  }
}
