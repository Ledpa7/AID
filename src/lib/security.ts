import { SecurityAuditReport, SecurityFinding, SecuritySeverity, SecurityTier } from "./types";

interface AuditCandidate {
  primaryAddress?: string;
  displayName?: string;
  description?: string;
  endpointUrl?: string;
  endpoints?: { url: string; protocol: string }[];
  capabilities?: any[];
  cardSnapshot?: any;
  isDomainVerified?: boolean;
}

interface SecurityRule {
  id: string;
  name: string;
  severity: SecuritySeverity;
  scoreImpact: number;
  regex: RegExp;
  description: string;
}

const SECURITY_RULES: SecurityRule[] = [
  {
    id: "RCE_SHELL",
    name: "Remote Code Execution / Shell Invocation Vector",
    severity: "CRITICAL",
    scoreImpact: 45,
    regex: /\b(exec|shell|bash|powershell|cmd|sh|spawn|eval|subprocess|system_call|terminal_run|run_script)\b/i,
    description: "Detected tools or parameters providing unrestricted system shell, bash, or code execution.",
  },
  {
    id: "ARBITRARY_FS",
    name: "Destructive File System or Path Traversal Pattern",
    severity: "HIGH",
    scoreImpact: 30,
    regex: /\b(rmdir|unlink|rm\s+-rf|format_disk|delete_all|overwrite_system|etc\/passwd|\.\.\/|\.\.\\)\b/i,
    description: "Detected file system deletion, path traversal, or unconstrained write capabilities.",
  },
  {
    id: "CREDENTIAL_EXFIL",
    name: "Credential Harvesting / Secret Exfiltration Vector",
    severity: "CRITICAL",
    scoreImpact: 40,
    regex: /\b(dump_env|export_keys|read_secret|steal_token|private_key_export|fetch_passwd|get_credentials|env_vars)\b/i,
    description: "Detected parameters or actions aiming to harvest or dump private keys, tokens, or environment credentials.",
  },
  {
    id: "SSRF_NETWORK",
    name: "SSRF / Internal Network Probing Target",
    severity: "CRITICAL",
    scoreImpact: 35,
    regex: /\b(127\.0\.0\.1|localhost|169\.254\.|10\.\d+\.\d+\.\d+|192\.168\.|internal_scan|port_scan|proxy_forward)\b/i,
    description: "Detected loopback, cloud metadata (169.254.x), or internal private subnet scanning targets.",
  },
  {
    id: "PROMPT_INJECTION",
    name: "Prompt Injection / Jailbreak Trigger Keyword",
    severity: "HIGH",
    scoreImpact: 30,
    regex: /(ignore\s+previous\s+instructions|system\s+prompt\s+override|jailbreak|bypass\s+safety|developer\s+mode\s+enabled|dan\s+mode)/i,
    description: "Detected phrases commonly used to trigger prompt injection, system prompt bypass, or jailbreaks.",
  },
];

/**
 * Audits an agent's capability definitions, description, endpoints, and card metadata.
 * Returns an objective Security Audit Report with risk scoring and trust tiering.
 */
export function auditAgentSecurity(agent: AuditCandidate): SecurityAuditReport {
  const findings: SecurityFinding[] = [];
  let riskScore = 0;

  // Aggregate inspectable text payload
  const inspectTargets: { source: string; text: string }[] = [];

  if (agent.displayName) {
    inspectTargets.push({ source: "Display Name", text: agent.displayName });
  }
  if (agent.description) {
    inspectTargets.push({ source: "Description", text: agent.description });
  }

  // Endpoints inspection
  const endpoints = agent.endpoints || (agent.endpointUrl ? [{ url: agent.endpointUrl, protocol: "unknown" }] : []);
  for (const ep of endpoints) {
    inspectTargets.push({ source: "Endpoint URL", text: ep.url });
    // Check if public endpoint uses insecure HTTP (non-localhost)
    if (ep.url.startsWith("http://") && !ep.url.includes("localhost") && !ep.url.includes("127.0.0.1")) {
      findings.push({
        ruleId: "INSECURE_HTTP_ENDPOINT",
        severity: "MEDIUM",
        message: "Endpoint uses unencrypted HTTP protocol instead of HTTPS.",
        matchedPattern: ep.url,
      });
      riskScore += 15;
    }
  }

  // Capabilities / Tools inspection
  if (Array.isArray(agent.capabilities)) {
    for (const cap of agent.capabilities) {
      const capStr = typeof cap === "string" ? cap : JSON.stringify(cap);
      const capName = cap?.action || cap?.name || "unnamed_tool";
      inspectTargets.push({ source: `Tool: ${capName}`, text: capStr });
    }
  }

  // Card Snapshot metadata inspection
  if (agent.cardSnapshot && agent.cardSnapshot.snapshotJson) {
    inspectTargets.push({
      source: "Agent Card Snapshot",
      text: JSON.stringify(agent.cardSnapshot.snapshotJson),
    });
  }

  // Run security rules against inspect targets
  const triggeredRuleIds = new Set<string>();

  for (const target of inspectTargets) {
    for (const rule of SECURITY_RULES) {
      const match = target.text.match(rule.regex);
      if (match && !triggeredRuleIds.has(rule.id)) {
        triggeredRuleIds.add(rule.id);
        findings.push({
          ruleId: rule.id,
          severity: rule.severity,
          message: `${rule.name}: found in ${target.source}.`,
          matchedPattern: match[0],
        });
        riskScore += rule.scoreImpact;
      }
    }
  }

  // Add domain verification status check
  if (agent.isDomainVerified === false) {
    riskScore += 10;
  }

  // Cap risk score between 0 and 100
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determine Trust Tier
  let tier: SecurityTier = "SECURE";
  if (riskScore >= 70) {
    tier = "DANGEROUS";
  } else if (riskScore >= 40) {
    tier = "WARNING";
  } else if (riskScore >= 15) {
    tier = "ELEVATED";
  } else {
    tier = "SECURE";
  }

  const passedChecks: string[] = [];
  if (!triggeredRuleIds.has("RCE_SHELL")) {
    passedChecks.push("No Remote Code Execution (RCE) or Shell execution vectors");
  }
  if (!triggeredRuleIds.has("ARBITRARY_FS")) {
    passedChecks.push("No Destructive File Operations or Path Traversal vectors");
  }
  if (!triggeredRuleIds.has("CREDENTIAL_EXFIL")) {
    passedChecks.push("No Credential Harvesting or Secret Exfiltration patterns");
  }
  if (!triggeredRuleIds.has("SSRF_NETWORK")) {
    passedChecks.push("No SSRF or Internal Private Network Probe targets");
  }
  if (!triggeredRuleIds.has("PROMPT_INJECTION")) {
    passedChecks.push("No Prompt Injection or Jailbreak bypass triggers");
  }

  let summary = "Agent capabilities pass automated safety checks with no malicious vectors.";
  if (tier === "DANGEROUS") {
    summary = "CRITICAL ALERT: Agent provides high-risk shell, file system, or credential access capabilities. Direct execution blocked.";
  } else if (tier === "WARNING") {
    summary = "CAUTION: Elevated risk detected. Sandboxing and prompt sanitization strongly recommended before tool invocation.";
  } else if (tier === "ELEVATED") {
    summary = "NOTICE: Agent operates with standard operational permissions. Verified domain recommended.";
  }

  return {
    riskScore,
    tier,
    isSafe: tier === "SECURE" || tier === "ELEVATED",
    summary,
    passedChecks,
    findings,
    auditedAt: new Date().toISOString(),
  };
}
