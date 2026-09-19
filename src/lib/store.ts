import { createClient } from "@supabase/supabase-js";
import { Namespace, Agent, ResolutionResponse, AgentEndpoint } from "./types";
import {
  generateAID,
  generateEndpointId,
  generateNamespaceId,
  generateKeyId,
} from "./ulid";
import crypto from "crypto";

// Initial Demo Seed Data
const initialNamespaces: Namespace[] = [
  {
    id: "ns_01K72M8KQ4JIDOO",
    slug: "jidoo",
    name: "Jidoo Autonomous Systems",
    domain: "jidoo.net",
    status: "CLAIMED",
    isVerified: true,
    verifiedAt: "2026-09-01T10:00:00Z",
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "ns_01K72M8KQ4SAMSUNG",
    slug: "samsung",
    name: "Samsung Electronics AI",
    domain: "samsung.com",
    status: "CLAIMED",
    isVerified: true,
    verifiedAt: "2026-09-05T12:00:00Z",
    createdAt: "2026-09-05T12:00:00Z",
    updatedAt: "2026-09-05T12:00:00Z",
  },
];

const initialAgents: Agent[] = [
  {
    id: "aid_01K72M8KQ4A7F901",
    namespaceId: "ns_01K72M8KQ4JIDOO",
    namespaceSlug: "jidoo",
    defaultAlias: "research",
    displayName: "Technology Research Agent",
    description: "Deep web intelligence, paper synthesis, and patent search agent.",
    visibility: "PUBLIC",
    status: "ACTIVE",
    primaryAddress: "research@jidoo",
    endpoints: [
      {
        id: "ep_01K72M8KQ4EP01",
        agentId: "aid_01K72M8KQ4A7F901",
        protocol: "a2a",
        url: "https://agent.jidoo.net/a2a",
        isPrimary: true,
        isActive: true,
        createdAt: "2026-09-01T10:00:00Z",
      },
      {
        id: "ep_01K72M8KQ4EP02",
        agentId: "aid_01K72M8KQ4A7F901",
        protocol: "mcp",
        url: "https://agent.jidoo.net/mcp",
        isPrimary: false,
        isActive: true,
        createdAt: "2026-09-01T10:00:00Z",
      },
    ],
    publicKey: "ed25519:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    isDomainVerified: true,
    isKeyVerified: true,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "aid_01K72M8KQ4A7F902",
    namespaceId: "ns_01K72M8KQ4SAMSUNG",
    namespaceSlug: "samsung",
    defaultAlias: "support",
    displayName: "Customer Support Automation",
    description: "Global 24/7 technical customer support routing agent.",
    visibility: "PUBLIC",
    status: "ACTIVE",
    primaryAddress: "support@samsung",
    endpoints: [
      {
        id: "ep_01K72M8KQ4EP03",
        agentId: "aid_01K72M8KQ4A7F902",
        protocol: "a2a",
        url: "https://support-agent.samsung.com/v1/a2a",
        isPrimary: true,
        isActive: true,
        createdAt: "2026-09-05T12:00:00Z",
      },
    ],
    publicKey: "ed25519:8a93b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9123",
    isDomainVerified: true,
    isKeyVerified: true,
    createdAt: "2026-09-05T12:00:00Z",
    updatedAt: "2026-09-05T12:00:00Z",
  },
];

// Global in-memory cache for seamless local testing
const globalStore = {
  namespaces: [...initialNamespaces],
  agents: [...initialAgents],
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
      const { data, error } = await supabase.from("namespaces").select("*");
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
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
    }
    return globalStore.namespaces;
  }

  static async findNamespaceBySlug(slug: string): Promise<Namespace | null> {
    const normalized = slug.replace(/^@/, "").toLowerCase();
    const supabase = this.getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from("namespaces")
        .select("*")
        .eq("slug", normalized)
        .single();
      if (data) {
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
      await supabase.from("namespaces").insert({
        id: newNs.id,
        slug: newNs.slug,
        name: newNs.name,
        domain: newNs.domain,
        status: newNs.status,
        is_verified: newNs.isVerified,
        created_at: newNs.createdAt,
        updated_at: newNs.updatedAt,
      });
    }

    globalStore.namespaces.push(newNs);
    return newNs;
  }

  // --- Agents ---
  static async getAgents(): Promise<Agent[]> {
    const supabase = this.getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("agents")
        .select(
          `
          *,
          namespaces(slug, is_verified),
          agent_endpoints(*),
          agent_keys(*)
        `
        )
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => {
          const endpoints: AgentEndpoint[] = (d.agent_endpoints || []).map(
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
          const primaryKey = (d.agent_keys || []).find(
            (k: any) => k.is_primary && !k.is_revoked
          );
          const nsSlug = d.namespaces?.slug || d.namespace_id;
          const isDomainVerified = !!d.namespaces?.is_verified;

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
    }
    return globalStore.agents;
  }

  static async findAgentByAID(aid: string): Promise<Agent | null> {
    const supabase = this.getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from("agents")
        .select(
          `
          *,
          namespaces(slug, is_verified),
          agent_endpoints(*),
          agent_keys(*)
        `
        )
        .eq("id", aid)
        .single();

      if (data) {
        const endpoints: AgentEndpoint[] = (data.agent_endpoints || []).map(
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
        const primaryKey = (data.agent_keys || []).find(
          (k: any) => k.is_primary && !k.is_revoked
        );
        const nsSlug = data.namespaces?.slug || data.namespace_id;
        return {
          id: data.id,
          namespaceId: data.namespace_id,
          namespaceSlug: nsSlug,
          defaultAlias: data.default_alias,
          displayName: data.display_name,
          description: data.description,
          visibility: data.visibility,
          status: data.status,
          primaryAddress: `${data.default_alias}@${nsSlug}`,
          endpoints,
          publicKey: primaryKey?.public_key,
          isDomainVerified: !!data.namespaces?.is_verified,
          isKeyVerified: !!primaryKey,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    }
    return globalStore.agents.find((a) => a.id === aid) || null;
  }

  static async resolveAddress(address: string): Promise<ResolutionResponse | null> {
    const raw = address.toLowerCase().trim();
    const [aliasPart, namespacePart] = raw.split("@");
    if (!aliasPart || !namespacePart) return null;

    const supabase = this.getSupabaseClient();
    if (supabase) {
      // 1. Check agent_aliases table
      const { data: aliasData } = await supabase
        .from("agent_aliases")
        .select("agent_id")
        .eq("full_address", `${aliasPart}@${namespacePart}`)
        .eq("is_active", true)
        .single();

      const targetAgentId = aliasData?.agent_id;
      if (targetAgentId) {
        const agent = await this.findAgentByAID(targetAgentId);
        if (agent) {
          const ns = await this.findNamespaceBySlug(agent.namespaceSlug);
          const primaryEndpoint =
            agent.endpoints.find((ep) => ep.isPrimary) || agent.endpoints[0];

          return {
            aid: agent.id,
            address: `${aliasPart}@${namespacePart}`,
            status: agent.status,
            visibility: agent.visibility,
            namespace: {
              slug: agent.namespaceSlug,
              domain: ns?.domain,
              isVerified: !!ns?.isVerified,
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
              card: false,
            },
            capabilities: ["web.search", "a2a.query"],
            publicKey: agent.publicKey,
            resolvedAt: new Date().toISOString(),
          };
        }
      }
    }

    // In-memory fallback
    const agent = globalStore.agents.find(
      (a) =>
        a.primaryAddress.toLowerCase() === `${aliasPart}@${namespacePart}` ||
        (a.defaultAlias.toLowerCase() === aliasPart &&
          a.namespaceSlug.toLowerCase() === namespacePart)
    );

    if (!agent) return null;

    const ns = await this.findNamespaceBySlug(agent.namespaceSlug);
    const primaryEndpoint =
      agent.endpoints.find((ep) => ep.isPrimary) || agent.endpoints[0];

    return {
      aid: agent.id,
      address: agent.primaryAddress,
      status: agent.status,
      visibility: agent.visibility,
      namespace: {
        slug: agent.namespaceSlug,
        domain: ns?.domain,
        isVerified: !!ns?.isVerified,
      },
      endpoints: agent.endpoints.map((ep) => ({
        protocol: ep.protocol,
        url: ep.url,
        isPrimary: ep.isPrimary,
      })),
      primaryEndpoint: primaryEndpoint
        ? {
            protocol: primaryEndpoint.protocol,
            url: primaryEndpoint.url,
          }
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
      throw new Error(`Namespace @${params.namespaceSlug} does not exist.`);
    }

    const fullAddress = `${params.alias.toLowerCase()}@${ns.slug}`;
    const duplicate = globalStore.agents.find(
      (a) => a.primaryAddress.toLowerCase() === fullAddress
    );
    if (duplicate) {
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
      await supabase.from("agents").insert({
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

      // 2. Insert Alias
      await supabase.from("agent_aliases").insert({
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
      await supabase.from("agent_endpoints").insert({
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
        await supabase.from("agent_keys").insert({
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

      await supabase.from("identity_events").insert({
        agent_id: newAgent.id,
        event_type: "AGENT_CREATED",
        payload: { address: fullAddress, endpoint: params.endpointUrl },
        event_hash: eventHash,
      });
    }

    globalStore.agents.unshift(newAgent);
    return newAgent;
  }
}
