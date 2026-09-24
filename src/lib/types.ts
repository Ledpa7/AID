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
  securityAudit?: SecurityAuditReport;
  trustLadder?: TrustLadder;
  healthStatus?: AgentHealthStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AgentHealthStatus {
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  latencyMs: number;
  httpStatus: number;
  checkedAt: string;
  message?: string;
}

export type TrustLevelId = "registered" | "key" | "domain" | "shield" | "live";

export interface TrustBadgeItem {
  id: TrustLevelId;
  level: number; // 0, 1, 2, 3, 4
  name: string;
  icon: string;
  achieved: boolean;
  title: string;
  description: string;
  actionHint?: string;
}

export interface TrustLadder {
  currentLevel: number; // 0 to 4
  maxLevel: number; // 4
  percentage: number; // 0 to 100
  levelLabel: string; // e.g. "Lv.4 Certified Live"
  levelColor: string; // "emerald" | "blue" | "amber" | "slate"
  badges: TrustBadgeItem[];
  nextAction?: string;
}

export type SecuritySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type SecurityTier = "SECURE" | "ELEVATED" | "WARNING" | "DANGEROUS";

export interface SecurityFinding {
  ruleId: string;
  severity: SecuritySeverity;
  message: string;
  toolName?: string;
  matchedPattern?: string;
}

export interface SecurityAuditReport {
  riskScore: number; // 0 - 100
  tier: SecurityTier;
  isSafe: boolean;
  summary: string;
  passedChecks: string[];
  findings: SecurityFinding[];
  auditedAt: string;
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
  securityAudit?: SecurityAuditReport;
  trustLadder?: TrustLadder;
  healthStatus?: AgentHealthStatus;
  resolvedAt: string;
}




export interface EnrollmentToken {
  id: string; // tok_...
  namespaceId: string;
  namespaceSlug: string;
  name: string;
  tokenHash: string;
  tokenPrefix: string;
  scopes: string[];
  maxAgents: number;
  usedAgents: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentTokenParams {
  namespaceSlug: string;
  name: string;
  maxAgents?: number;
  expiresInDays?: number;
  scopes?: string[];
}

export interface AutoEnrollParams {
  token: string;
  alias: string;
  displayName: string;
  endpointUrl: string;
  protocol?: ProtocolType;
  publicKey?: string;
  description?: string;
  category?: AgentCategory;
}

export interface EnrollmentResponse {
  success: boolean;
  aid: string;
  address: string;
  displayName: string;
  namespace: string;
  endpoint: {
    protocol: ProtocolType;
    url: string;
  };
  publicKey?: string;
  isDomainVerified: boolean;
  isKeyVerified: boolean;
  tokenUsed: {
    name: string;
    remainingQuota: number;
  };
  enrolledAt: string;
}

export interface GetAgentsParams {
  limit?: number;
  cursor?: string;
  query?: string;
  namespace?: string;
  category?: AgentCategory | string;
  protocol?: ProtocolType | string;
  minTrustLevel?: number;
}

export interface PaginatedAgentsResult {
  agents: Agent[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
  limit: number;
}

// ==========================================
// Agent-to-Agent Attestation & Proof Types
// ==========================================

export interface AgentPassportTokenPayload {
  aid: string;
  address: string;
  displayName: string;
  publicKey: string;
  namespace: string;
  isDomainVerified: boolean;
  trustLevel: number;
  capabilities: string[];
  issuedAt: number;
  expiresAt: number;
}

export interface AgentPassportToken {
  version: "aid-vc-v1";
  payload: AgentPassportTokenPayload;
  rootSignature: string; // Ed25519 signature by AID Root Authority
}

export type ExecutionStatusCode = "SUCCESS" | "FAILED" | "SECURITY_BLOCKED" | "TIMEOUT";

export interface ExecutionReceipt {
  receiptId: string;            // rcpt_01M...
  requesterAddress: string;     // e.g. orchestrator@enterprise
  executorAddress: string;      // e.g. scout@github
  executorAid: string;          // aid_01M...
  inputHash: string;            // sha256 hex of input/prompt
  outputHash: string;           // sha256 hex of result/output
  executionTimeMs: number;
  statusCode: ExecutionStatusCode;
  errorMessage?: string;
  timestamp: number;
  executorSignature: string;    // Ed25519 signature by executor agent
}

export interface CreateReceiptParams {
  requesterAddress: string;
  executorAddress: string;
  executorAid: string;
  inputPayload: any;
  outputPayload: any;
  executionTimeMs: number;
  statusCode?: ExecutionStatusCode;
  errorMessage?: string;
  privateKeyPem: string;
}

export interface VerifyReceiptParams {
  receipt: ExecutionReceipt;
  inputPayload?: any;
  outputPayload?: any;
  executorPublicKey?: string;
}

export interface AgentReputationMetrics {
  address: string;
  totalExecutions: number;
  successRate: number;        // 0.0 - 1.0
  averageLatencyMs: number;
  failedExecutions: number;
  securityBlockedCount: number;
  reputationScore: number;    // 0 - 100
  tier: "ELITE" | "RELIABLE" | "UNPROVEN" | "HIGH_RISK";
  lastActiveAt: string;
}



