import { createClient } from "@supabase/supabase-js";
import { Namespace, Agent, ResolutionResponse } from "./types";
import { generateAID, generateEndpointId, generateNamespaceId } from "./ulid";

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
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
      if (!error && data) return data as Namespace[];
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
      if (data) return data as Namespace;
    }
    return globalStore.namespaces.find((ns) => ns.slug.toLowerCase() === normalized) || null;
  }

  static async createNamespace(slug: string, name: string, domain?: string): Promise<Namespace> {
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
      await supabase.from("namespaces").insert(newNs);
    }

    globalStore.namespaces.push(newNs);
    return newNs;
  }

  // --- Agents ---
  static async getAgents(): Promise<Agent[]> {
    const supabase = this.getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.from("agents").select("*, agent_endpoints(*)");
      if (data) return data as Agent[];
    }
    return globalStore.agents;
  }

  static async findAgentByAID(aid: string): Promise<Agent | null> {
    const supabase = this.getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.from("agents").select("*").eq("id", aid).single();
      if (data) return data as Agent;
    }
    return globalStore.agents.find((a) => a.id === aid) || null;
  }

  static async resolveAddress(address: string): Promise<ResolutionResponse | null> {
    const [aliasPart, namespacePart] = address.toLowerCase().split("@");
    if (!aliasPart || !namespacePart) return null;

    const agent = globalStore.agents.find(
      (a) =>
        a.primaryAddress.toLowerCase() === `${aliasPart}@${namespacePart}` ||
        (a.defaultAlias.toLowerCase() === aliasPart && a.namespaceSlug.toLowerCase() === namespacePart)
    );

    if (!agent) return null;

    const ns = await this.findNamespaceBySlug(agent.namespaceSlug);
    const primaryEndpoint = agent.endpoints.find((ep) => ep.isPrimary) || agent.endpoints[0];

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
          id: generateEndpointId(),
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

    globalStore.agents.unshift(newAgent);
    return newAgent;
  }
}
