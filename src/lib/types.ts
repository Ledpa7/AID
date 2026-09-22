export type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
export type AgentStatus = "ACTIVE" | "SUSPENDED" | "COMPROMISED" | "REVOKED";
export type NamespaceStatus = "AVAILABLE" | "CLAIMED" | "RESERVED" | "VERIFICATION_REQUIRED" | "SUSPENDED";
export type ProtocolType = "a2a" | "mcp" | "rest";
export type AgentCategory = "Coding" | "Research" | "Design" | "DevOps" | "Media" | "General";

export interface Namespace {
  id: string;
  slug: string;
  name: string;
  ownerId?: string;
  domain?: string;
  status: NamespaceStatus;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentEndpoint {
  id: string;
  agentId: string;
  protocol: ProtocolType;
  url: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AgentCardSnapshot {
  id: string;
  agentId: string;
  sourceUrl: string;
  snapshotJson: Record<string, any>;
  sha256Hash: string;
  status: "VALID" | "EXPIRED" | "FETCH_FAILED";
  fetchedAt: string;
}

export interface AgentKey {
  id: string;
  agentId: string;
  keyType: "Ed25519";
  publicKey: string;
  isPrimary: boolean;
  isRevoked: boolean;
  createdAt: string;
}

export interface Agent {
  id: string; // Permanent AID e.g. 'aid_01K72M8KQ4A7F'
  namespaceId: string;
  namespaceSlug: string;
  namespaceDomain?: string;
  defaultAlias: string;
  displayName: string;
  description?: string;
  category?: AgentCategory;
  visibility: Visibility;
  status: AgentStatus;
  primaryAddress: string; // e.g. 'registry@aid'
  endpoints: AgentEndpoint[];
  publicKey?: string;
  cardSnapshot?: AgentCardSnapshot;
  isDomainVerified: boolean;
  isKeyVerified: boolean;
  isLimited?: boolean;
  limitedReason?: string;
  registeredBy?: "OWNER" | "COMMUNITY";
  createdAt: string;
  updatedAt: string;
}

export interface ResolutionResponse {
  aid: string;
  address: string;
  status: AgentStatus;
  visibility: Visibility;
  category?: AgentCategory;
  isLimited?: boolean;
  limitedReason?: string;
  registeredBy?: "OWNER" | "COMMUNITY";
  namespace: {
    slug: string;
    domain?: string;
    isVerified: boolean;
  };
  endpoints: {
    protocol: ProtocolType;
    url: string;
    isPrimary: boolean;
  }[];
  primaryEndpoint?: {
    protocol: ProtocolType;
    url: string;
  };
  verification: {
    domain: boolean;
    key: boolean;
    card: boolean;
  };
  capabilities?: string[];
  publicKey?: string;
  resolvedAt: string;
}
