import { Agent, SecurityAuditReport, TrustBadgeItem, TrustLadder, AgentHealthStatus } from "./types";

interface TrustCandidate {
  id?: string;
  primaryAddress?: string;
  isKeyVerified?: boolean;
  publicKey?: string;
  isDomainVerified?: boolean;
  registeredBy?: "OWNER" | "COMMUNITY";
  endpoints?: { url: string; protocol: string; isActive?: boolean }[];
  isLimited?: boolean;
  securityAudit?: SecurityAuditReport;
  healthStatus?: AgentHealthStatus;
}

/**
 * Calculates progressive trust tier and checklist progress (0 to 4 levels).
 * Frictionless registration allows Lv.0; progressive evidence unlocks higher tiers.
 */
export function calculateTrustLadder(agent: TrustCandidate): TrustLadder {
  const isRegistered = true; // Level 0: Always achieved once registered
  const hasKey = !!agent.isKeyVerified || !!agent.publicKey;
  const hasDomain = !!agent.isDomainVerified;
  const isShieldSafe = !!agent.securityAudit && (agent.securityAudit.tier === "SECURE" || agent.securityAudit.tier === "ELEVATED");
  const isLive =
    Array.isArray(agent.endpoints) &&
    agent.endpoints.length > 0 &&
    !agent.isLimited &&
    agent.healthStatus?.status !== "DOWN";

  const isCommunity = agent.registeredBy === "COMMUNITY";

  const badges: TrustBadgeItem[] = [
    {
      id: "registered",
      level: 0,
      name: isCommunity ? "Community Entry" : "Registered",
      icon: isCommunity ? "👥" : "⚪",
      achieved: isRegistered,
      title: isCommunity ? "Open Community Registration" : "Registry Record Active",
      description: isCommunity
        ? "Permissionless open community submission. Permanent AID (ULID) active."
        : "Permanent AID (ULID) and alias handle registered by verified owner.",
    },
    {
      id: "key",
      level: 1,
      name: "Key Verified",
      icon: "🔑",
      achieved: hasKey,
      title: "Cryptographic Key Verified",
      description: "Ed25519 public key registered and verifiable via challenge signature.",
      actionHint: "Register an Ed25519 public key to immediately unlock Lv.1.",
    },
    {
      id: "domain",
      level: 2,
      name: "Domain Verified",
      icon: "🌐",
      achieved: hasDomain,
      title: hasDomain ? "Domain Ownership Verified" : "Domain Ownership Pending",
      description: hasDomain
        ? "Validated via live DNS TXT record (_aid.domain.com) by verified owner."
        : isCommunity
        ? "Community submission unclaimed by domain owner. Domain owner can claim via token."
        : "Validated via live DNS TXT record (_aid.domain.com).",
      actionHint: hasDomain
        ? undefined
        : "Add a verification token to your DNS TXT record to earn the spoof-proof badge.",
    },

    {
      id: "shield",
      level: 3,
      name: "Shield Safe",
      icon: "🛡️",
      achieved: isShieldSafe,
      title: "Security Shield Passed",
      description: "No malicious vectors detected (RCE shell, file destroy, credential exfil, SSRF).",
      actionHint: "Remove dangerous shell commands and restrict tool permissions to earn this badge.",
    },
    {
      id: "live",
      level: 4,
      name: "Live Responding",
      icon: "⚡",
      achieved: isLive,
      title: "Live Endpoint Responding",
      description: "Publicly callable communication endpoint is connected and responding.",
      actionHint: "Connect a live public REST/MCP/A2A endpoint URL to receive the live badge.",
    },
  ];

  // Calculate achieved count (0 to 4)
  const achievedLevels = [hasKey, hasDomain, isShieldSafe, isLive].filter(Boolean).length;
  const currentLevel = achievedLevels;
  const maxLevel = 4;
  const percentage = Math.round((currentLevel / maxLevel) * 100);

  let levelLabel = "Lv.0 Registered";
  let levelColor = "slate";

  if (currentLevel === 4) {
    levelLabel = "Lv.4 Certified Live";
    levelColor = "emerald";
  } else if (currentLevel === 3) {
    levelLabel = "Lv.3 Shield Safe";
    levelColor = "blue";
  } else if (currentLevel === 2) {
    levelLabel = "Lv.2 Domain Verified";
    levelColor = "amber";
  } else if (currentLevel === 1) {
    levelLabel = "Lv.1 Key Verified";
    levelColor = "cyan";
  }

  // Next recommendation
  let nextAction: string | undefined;
  if (!hasKey) {
    nextAction = "Next Trust Unlock: Register an Ed25519 public key.";
  } else if (!hasDomain) {
    nextAction = "Next Trust Unlock: Prove domain ownership via DNS TXT record.";
  } else if (!isShieldSafe) {
    nextAction = "Next Trust Unlock: Address Security Shield audit warnings.";
  } else if (!isLive) {
    nextAction = "Next Trust Unlock: Connect a live communication endpoint.";
  }

  return {
    currentLevel,
    maxLevel,
    percentage,
    levelLabel,
    levelColor,
    badges,
    nextAction,
  };
}
