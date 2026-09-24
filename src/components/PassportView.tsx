"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Globe,
  KeyRound,
  Server,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  Share2,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Code2,
  FileCode,
  Users,
  Zap,
  Activity,
  Play,
  Sparkles,
  RefreshCw,
} from "lucide-react";

import { Agent, ResolutionResponse } from "@/lib/types";

interface PassportViewProps {
  agent: Agent;
  resolution: ResolutionResponse;
  domainUrl: string;
}

const sampleQueries: Record<string, string[]> = {
  "scout@github": [
    "trending_templates",
    "vibe coding boilerplate",
    "facebook/react",
  ],
  "composer@cursor": [
    "Refactor multi-file state management with Zustand",
    "Optimize database pool connection timeout",
  ],
  "search@perplexity": [
    "Latest benchmark comparing Claude 3.7 vs OpenAI o3-mini",
    "Next.js 15 App Router streaming architecture",
  ],
  "swe@devin": [
    "Debug memory leak in Next.js edge runtime container",
    "Write end-to-end Cypress test suite",
  ],
  "ui@v0": [
    "Modern dark-mode dashboard hero component with Tailwind CSS",
    "Pricing table card with toggle switch",
  ],
  "cli@claude": [
    "Audit git diff for security vulnerabilities",
    "Run static analysis and type check on workspace",
  ],
  "builder@lovable": [
    "Build SaaS subscription portal with Supabase RLS",
    "Create landing page with Stripe checkout",
  ],
  "stack@bolt": [
    "Spin up Vite + React + Tailwind WebContainer",
    "Install SQLite in-browser sandbox",
  ],
  "researcher@consensus": [
    "Consensus on transformer context window scaling laws",
    "Impact of reinforcement learning on reasoning models",
  ],
  "sentinel@cloudflare": [
    "Inspect global edge latency and DDoS mitigation rules",
    "Check TLS 1.3 compliance and edge worker status",
  ],
  "curator@spotify": [
    "Deep focus coding session synthwave playlist",
    "Lo-fi ambient background music for writing",
  ],
  "registry@aid": [
    "Resolve cryptographic identity proof for scout@github",
    "Audit root namespace verification status",
  ],
  "oracle@aid": [
    "Verify zero-knowledge proof for domain DNS txt record",
    "Validate agent public key revocation state",
  ],
};

export default function PassportView({ agent, resolution, domainUrl }: PassportViewProps) {
  const [activeTab, setActiveTab] = useState<"mcp" | "curl" | "sdk" | "badge">("mcp");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Playground State
  const [pingStatus, setPingStatus] = useState<"idle" | "loading" | "success" | "error" | "restricted">("idle");
  const [pingResult, setPingResult] = useState<any>(null);

  const agentSamples = sampleQueries[agent.primaryAddress] || [
    "Ping and verify agent capability handshake",
    "Inspect protocol specification",
  ];
  const [queryInput, setQueryInput] = useState<string>(agentSamples[0]);
  const [isQueryRunning, setIsQueryRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryView, setQueryView] = useState<"markdown" | "json">("markdown");

  const runPing = async () => {
    setPingStatus("loading");
    try {
      const res = await fetch("/api/v1/agents/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: agent.primaryAddress }),
      });
      const data = await res.json();
      setPingResult(data);
      if (data.isLimited) {
        setPingStatus("restricted");
      } else if (data.success) {
        setPingStatus("success");
      } else {
        setPingStatus("error");
      }
    } catch (e: any) {
      setPingStatus("error");
      setPingResult({ error: e.message || "Network error" });
    }
  };

  const runQuery = async (queryText?: string) => {
    const textToSend = (queryText !== undefined ? queryText : queryInput).trim();
    if (!textToSend) return;
    setIsQueryRunning(true);
    setQueryResult(null);
    try {
      const res = await fetch("/api/v1/agents/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: agent.primaryAddress,
          query: textToSend,
        }),
      });
      const data = await res.json();
      setQueryResult(data);
    } catch (e: any) {
      setQueryResult({ error: e.message || "Failed to execute query" });
    } finally {
      setIsQueryRunning(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const primaryEndpoint =
    resolution.endpoints.find((ep) => ep.isPrimary) || resolution.endpoints[0];

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        [agent.defaultAlias || "aid-agent"]: {
          command: "node",
          args: [
            "-e",
            `fetch('${domainUrl}/api/v1/resolve/${agent.primaryAddress}').then(r=>r.json()).then(d=>console.log(JSON.stringify(d)))`,
          ],
        },
      },
    },
    null,
    2
  );

  const curlCommand = `curl -sL "${domainUrl}/api/v1/resolve/${agent.primaryAddress}"`;

  const sdkCode = `// Install AID or fetch directly
const response = await fetch("${domainUrl}/api/v1/resolve/${agent.primaryAddress}");
const passport = await response.json();

console.log("Agent AID:", passport.aid);
console.log("Verified Domain:", passport.verification.domain);
console.log("Endpoint:", passport.primaryEndpoint?.url);`;

  const badgeMarkdown = `[![AID Verified](${domainUrl}/api/v1/badge/${agent.primaryAddress})](${domainUrl}/${agent.primaryAddress})`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-yellow-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Navigation Top Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-lg backdrop-blur"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Registry Explorer</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(typeof window !== "undefined" ? window.location.href : "", "url")}
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            {copiedKey === "url" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Passport</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Digital Passport Document Card */}
      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-10 relative">
        {/* Passport Top Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-yellow-950/30 to-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono tracking-widest text-yellow-400 uppercase font-semibold">
                AID Official Passport
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Decentralized AI Agent Identity & Trust Attestation
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {agent.registeredBy === "COMMUNITY" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-300">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                Community Listed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Official Owner
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {agent.status}
            </span>
          </div>
        </div>

        {/* Passport Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Identity Core */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${agent.isLimited ? "text-red-400" : "text-white"}`}>
                  {agent.displayName}
                </h1>
                {agent.registeredBy === "COMMUNITY" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-semibold">
                    <Users className="w-3 h-3 text-purple-400" />
                    Community Registered
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Verified Owner
                  </span>
                )}
                {agent.isLimited && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Limited Profile: Closed API (No public endpoint)
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                {agent.description || "No official description published for this agent."}
              </p>

              {/* Claim Ownership Banner for Community Listed Agents */}
              {agent.registeredBy === "COMMUNITY" && (
                <div className="mt-3 bg-purple-950/20 border border-purple-900/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5 text-purple-300">
                    <Users className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-purple-200">This agent was submitted by the community</div>
                      <p className="text-purple-400/80 text-[11px] leading-relaxed">
                        Are you the creator of this agent? Complete domain DNS TXT verification to claim the &apos;Verified Owner&apos; badge.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/?verify=${agent.namespaceSlug}#verify`}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shrink-0 text-center transition shadow-sm shadow-purple-600/30"
                  >
                    Claim Ownership
                  </Link>
                </div>
              )}

              {agent.isLimited && (
                <div className="mt-3 bg-red-950/30 border border-red-900/50 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-semibold text-red-300">Limited Capability Notice</div>
                    <p className="text-red-400/90 leading-relaxed text-[11px]">
                      This agent operates within a closed cloud VM ecosystem and does not yet expose a public MCP or REST API for live autonomous interaction. It is registered as a verifiable identity profile in the AID directory.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
                  <span className="text-xs text-slate-500 font-mono">Address:</span>
                  <span className="text-sm font-mono font-semibold text-emerald-400">
                    {agent.primaryAddress}
                  </span>
                  <button
                    onClick={() => copyToClipboard(agent.primaryAddress, "address")}
                    className="text-slate-500 hover:text-slate-300 transition"
                    title="Copy Address"
                  >
                    {copiedKey === "address" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="inline-flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400">
                  <span className="text-slate-500">AID:</span>
                  <span className="text-slate-300">{agent.id}</span>
                  <button
                    onClick={() => copyToClipboard(agent.id, "aid")}
                    className="text-slate-500 hover:text-slate-300 transition"
                    title="Copy AID"
                  >
                    {copiedKey === "aid" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Live SVG Badge preview card */}
            <div className="shrink-0 bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col items-center gap-2 self-start">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                Official Trust Badge
              </span>
              <img
                src={`/api/v1/badge/${encodeURIComponent(agent.primaryAddress)}`}
                alt={`${agent.primaryAddress} badge`}
                className="h-5"
              />
              <span className="text-[10px] text-slate-600 font-mono">
                Live Status: {resolution.verification.domain || resolution.verification.key ? "Verified" : "Registered"}
              </span>
            </div>
          </div>

          {/* Progressive Trust Ladder Checklist */}
          {resolution.trustLadder && (
            <div className="p-5 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 font-bold text-lg">
                    {resolution.trustLadder.currentLevel === 4 ? "⚡" : resolution.trustLadder.currentLevel === 3 ? "🛡️" : resolution.trustLadder.currentLevel === 2 ? "🌐" : resolution.trustLadder.currentLevel === 1 ? "🔑" : "⚪"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Trust Level Verification Ladder</span>
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">
                        {resolution.trustLadder.levelLabel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Higher trust tiers increase invocation priority for autonomous AI assistants (Claude, Cursor, Swarm).
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs font-mono text-slate-400">
                    Progress: <span className="text-yellow-400 font-bold">{resolution.trustLadder.currentLevel} / {resolution.trustLadder.maxLevel} Badges ({resolution.trustLadder.percentage}%)</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full sm:w-36 h-2 bg-slate-900 rounded-full mt-1.5 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 via-amber-300 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(10, resolution.trustLadder.percentage)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 5-Step Badge Ladder Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {resolution.trustLadder.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-xl border text-xs transition flex flex-col justify-between ${
                      badge.achieved
                        ? "bg-slate-900/90 border-emerald-500/30 text-slate-200"
                        : "bg-slate-950/40 border-slate-800/80 text-slate-500"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm">{badge.icon}</span>
                        {badge.achieved ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Earned
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            Locked
                          </span>
                        )}
                      </div>
                      <div className={`font-bold text-xs ${badge.achieved ? "text-white" : "text-slate-400"}`}>
                        Lv.{badge.level} {badge.name}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {badge.title}
                      </p>
                    </div>

                    {!badge.achieved && badge.actionHint && (
                      <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-yellow-400/90 font-mono">
                        💡 {badge.actionHint}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Next Action Recommendation */}
              {resolution.trustLadder.nextAction && (
                <div className="p-3 bg-yellow-400/5 border border-yellow-400/20 rounded-xl text-xs text-yellow-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span>{resolution.trustLadder.nextAction}</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    Zero-login cryptographic verification
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 3 Pillars of Trust Evidence */}
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">

              <Cpu className="w-4 h-4 text-yellow-400" />
              <span>Trust Evidence & Cryptographic Attestation</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pillar 1: Domain Verification */}
              <div
                className={`p-4 rounded-xl border ${
                  resolution.verification.domain
                    ? "bg-emerald-950/20 border-emerald-500/30"
                    : "bg-slate-950 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Domain Ownership</span>
                  </span>
                  {resolution.verification.domain ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
                      Unverified
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  {resolution.namespace.domain || "No custom domain"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {resolution.verification.domain
                    ? "Domain ownership mathematically verified via DNS TXT record."
                    : "Domain DNS verification is not yet completed."}
                </div>
              </div>

              {/* Pillar 2: Cryptographic Key */}
              <div
                className={`p-4 rounded-xl border ${
                  resolution.verification.key
                    ? "bg-yellow-950/20 border-yellow-400/30"
                    : "bg-slate-950 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Ed25519 Key</span>
                  </span>
                  {resolution.verification.key ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-yellow-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Audited
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
                      None
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-slate-300 truncate bg-slate-950/80 px-2 py-1 rounded border border-slate-800/80 flex items-center justify-between">
                  <span className="truncate">
                    {resolution.publicKey || "No Public Key Registered"}
                  </span>
                  {resolution.publicKey && (
                    <button
                      onClick={() => copyToClipboard(resolution.publicKey || "", "pubkey")}
                      className="ml-1 text-slate-500 hover:text-slate-200"
                      title="Copy Public Key"
                    >
                      {copiedKey === "pubkey" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Public key used to verify message integrity and prevent tampering.
                </div>
              </div>

              {/* Pillar 3: Namespace Authority */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Namespace Anchor</span>
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 font-medium">
                    @{resolution.namespace.slug}
                  </span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {resolution.namespace.slug === "aid"
                    ? "AID Protocol Foundation"
                    : `@${resolution.namespace.slug}`}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Maintained and isolated within official namespace boundaries.
                </div>
              </div>
            </div>
          </div>

          {/* AID Security Shield Audit */}
          {resolution.securityAudit && (
            <div className={`p-5 rounded-2xl border ${
              resolution.securityAudit.tier === "DANGEROUS"
                ? "bg-red-950/20 border-red-500/40"
                : resolution.securityAudit.tier === "WARNING"
                ? "bg-amber-950/20 border-amber-500/40"
                : "bg-slate-950/80 border-slate-800"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  {resolution.securityAudit.tier === "DANGEROUS" ? (
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  ) : resolution.securityAudit.tier === "WARNING" ? (
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Shield className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <span>AID Security Shield Audit</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        resolution.securityAudit.tier === "DANGEROUS"
                          ? "bg-red-500/20 text-red-300 border-red-500/40"
                          : resolution.securityAudit.tier === "WARNING"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      }`}>
                        TIER: {resolution.securityAudit.tier}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {resolution.securityAudit.summary}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-500">Risk Score:</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    resolution.securityAudit.riskScore >= 70
                      ? "bg-red-950 text-red-400 border border-red-800"
                      : resolution.securityAudit.riskScore >= 40
                      ? "bg-amber-950 text-amber-400 border border-amber-800"
                      : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  }`}>
                    {resolution.securityAudit.riskScore} / 100
                  </span>
                </div>
              </div>

              {/* Passed Safety Checks */}
              {resolution.securityAudit.passedChecks.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {resolution.securityAudit.passedChecks.map((chk, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{chk}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Security Findings if any */}
              {resolution.securityAudit.findings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Detected Security Warnings ({resolution.securityAudit.findings.length})</span>
                  </div>
                  {resolution.securityAudit.findings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 text-xs font-mono flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            finding.severity === "CRITICAL"
                              ? "bg-red-950 text-red-400 border border-red-800"
                              : finding.severity === "HIGH"
                              ? "bg-amber-950 text-amber-400 border border-amber-800"
                              : "bg-slate-800 text-slate-300"
                          }`}>
                            {finding.severity}
                          </span>
                          <span className="text-white font-sans text-xs">{finding.message}</span>
                        </div>
                      </div>
                      {finding.matchedPattern && (
                        <code className="text-[10px] text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/50 shrink-0">
                          {finding.matchedPattern}
                        </code>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Communication Endpoints */}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Communication Endpoints</span>
              </h2>

              {/* 1-Hour Automated Sentinel Status Badge */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[10px] text-slate-500 hidden sm:inline">1-Hour Sentinel:</span>
                {resolution.healthStatus ? (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    resolution.healthStatus.status === "HEALTHY"
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : resolution.healthStatus.status === "DEGRADED"
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      : "bg-red-500/15 text-red-400 border-red-500/30"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      resolution.healthStatus.status === "HEALTHY"
                        ? "bg-emerald-400 animate-pulse"
                        : resolution.healthStatus.status === "DEGRADED"
                        ? "bg-amber-400"
                        : "bg-red-500"
                    }`} />
                    <span>{resolution.healthStatus.status}</span>
                    <span>({resolution.healthStatus.latencyMs}ms)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>HEALTHY (24ms)</span>
                  </span>
                )}
              </div>
            </div>


            <div className="space-y-2">
              {resolution.endpoints.map((ep, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="uppercase font-bold px-2 py-0.5 rounded bg-yellow-950/40 text-yellow-400 border border-yellow-800/40 text-[10px]">
                      {ep.protocol}
                    </span>
                    {ep.isPrimary && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                        primary
                      </span>
                    )}
                    <span className="text-slate-300 truncate">{ep.url}</span>
                  </div>

                  <button
                    onClick={() => copyToClipboard(ep.url, `ep_${idx}`)}
                    className="text-slate-500 hover:text-slate-300 ml-2 p-1"
                    title="Copy URL"
                  >
                    {copiedKey === `ep_${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ⚡ Live Playground & Sandbox Console */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-yellow-400" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Live Playground</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                      Interactive
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Test real-time latency handshake and prompt execution directly against this agent's AID endpoint.
                </p>
              </div>

              {/* Ping Trigger Button */}
              <button
                onClick={runPing}
                disabled={pingStatus === "loading"}
                className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-yellow-400/50 text-xs font-semibold text-white transition flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 text-yellow-400 ${pingStatus === "loading" ? "animate-spin" : ""}`} />
                <span>{pingStatus === "loading" ? "Measuring..." : "⚡ Run Ping Test"}</span>
              </button>
            </div>

            {/* Ping & Diagnostics Status Bar */}
            <div className={`p-3.5 rounded-xl border transition-all text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              pingStatus === "success"
                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                : pingStatus === "restricted"
                ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
                : pingStatus === "error"
                ? "bg-red-950/20 border-red-500/30 text-red-300"
                : "bg-slate-900/60 border-slate-800 text-slate-400"
            }`}>
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  pingStatus === "success"
                    ? "bg-emerald-400 animate-pulse"
                    : pingStatus === "restricted"
                    ? "bg-amber-400"
                    : pingStatus === "error"
                    ? "bg-red-400"
                    : "bg-slate-600"
                }`} />

                <span className="font-semibold text-slate-200">
                  {pingStatus === "idle" && "Ready for diagnostic ping check"}
                  {pingStatus === "loading" && "Dispatching protocol handshake..."}
                  {pingStatus === "success" && "Endpoint Online & Responsive"}
                  {pingStatus === "restricted" && "Closed Ecosystem (Sandbox Mode)"}
                  {pingStatus === "error" && "Ping Failed"}
                </span>

                {pingResult?.latencyMs !== undefined && (
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-yellow-400 font-bold text-[11px]">
                    {pingResult.latencyMs}ms
                  </span>
                )}

                {pingResult?.httpStatus && (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    pingResult.httpStatus === 200
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  }`}>
                    HTTP {pingResult.httpStatus} {pingResult.statusText || ""}
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-500 truncate max-w-xs">
                {pingResult?.endpointUrl || primaryEndpoint?.url}
              </div>
            </div>

            {/* Notice for Closed/Limited Ecosystems */}
            {agent.isLimited && (
              <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-3.5 text-xs text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-red-200 font-semibold">Closed Sandbox Notice:</strong>{" "}
                  {agent.limitedReason || "This agent operates within a closed ecosystem without a public API. Direct prompt execution is restricted."}
                </div>
              </div>
            )}

            {/* Interactive Query Runner */}
            <div className="space-y-3">
              {/* Quick Sample Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 font-mono mr-1">Quick Prompts:</span>
                {agentSamples.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQueryInput(sample);
                      runQuery(sample);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-yellow-400/10 border border-slate-800 hover:border-yellow-400/40 text-[11px] text-slate-300 hover:text-yellow-300 transition truncate max-w-[280px]"
                  >
                    ⚡ {sample}
                  </button>
                ))}
              </div>

              {/* Input & Send Button */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Terminal className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isQueryRunning) {
                        runQuery();
                      }
                    }}
                    placeholder={`Send prompt to ${agent.primaryAddress}...`}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 font-mono transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => runQuery()}
                  disabled={isQueryRunning || !queryInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs transition flex items-center gap-1.5 shadow-sm shadow-yellow-400/20 disabled:opacity-50 shrink-0"
                >
                  <Play className={`w-3.5 h-3.5 ${isQueryRunning ? "animate-pulse" : ""}`} />
                  <span>{isQueryRunning ? "Running..." : "Run Query"}</span>
                </button>
              </div>

              {/* Terminal Output Viewer */}
              {(isQueryRunning || queryResult) && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                  {/* Terminal Header */}
                  <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-slate-400 text-[11px] ml-1">
                        aid-session://{agent.primaryAddress}
                      </span>
                    </div>

                    {queryResult && (
                      <div className="flex items-center gap-2">
                        {queryResult.tokensUsed && (
                          <span className="text-[10px] text-slate-400">
                            Tokens: <strong className="text-slate-200">{queryResult.tokensUsed}</strong>
                          </span>
                        )}
                        {queryResult.latencyMs && (
                          <span className="text-[10px] text-yellow-400">
                            {queryResult.latencyMs}ms
                          </span>
                        )}
                        <div className="flex items-center border border-slate-800 rounded-md overflow-hidden text-[10px]">
                          <button
                            type="button"
                            onClick={() => setQueryView("markdown")}
                            className={`px-2 py-0.5 ${queryView === "markdown" ? "bg-slate-800 text-white font-bold" : "text-slate-500"}`}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => setQueryView("json")}
                            className={`px-2 py-0.5 ${queryView === "json" ? "bg-slate-800 text-white font-bold" : "text-slate-500"}`}
                          >
                            JSON
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(JSON.stringify(queryResult, null, 2), "query_output")}
                          className="text-slate-500 hover:text-slate-300 p-0.5"
                          title="Copy Output"
                        >
                          {copiedKey === "query_output" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Terminal Body */}
                  <div className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[350px] overflow-y-auto">
                    {isQueryRunning ? (
                      <div className="flex items-center gap-2 text-yellow-400/90 py-4">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Communicating with agent gateway & executing query...</span>
                      </div>
                    ) : queryResult?.error ? (
                      <div className="text-red-400 py-2">
                        ⚠️ Error: {queryResult.error}
                      </div>
                    ) : queryView === "json" ? (
                      <pre className="text-emerald-400 text-[11px] whitespace-pre-wrap">
                        {JSON.stringify(queryResult, null, 2)}
                      </pre>
                    ) : (
                      <div className="space-y-3 leading-relaxed">
                        {queryResult?.title && (
                          <div className="text-sm font-bold text-white border-b border-slate-800 pb-1.5 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                            <span>{queryResult.title}</span>
                          </div>
                        )}
                        <div className="text-slate-200 whitespace-pre-wrap text-[11px]">
                          {typeof queryResult?.result === "string"
                            ? queryResult.result
                            : JSON.stringify(queryResult?.result, null, 2)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Developer Quickstart */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  Developer Quickstart
                </span>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setActiveTab("mcp")}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === "mcp"
                      ? "bg-yellow-400 text-black font-bold shadow-sm shadow-yellow-400/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Cursor / Claude (MCP)
                </button>
                <button
                  onClick={() => setActiveTab("curl")}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === "curl"
                      ? "bg-yellow-400 text-black font-bold shadow-sm shadow-yellow-400/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveTab("sdk")}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === "sdk"
                      ? "bg-yellow-400 text-black font-bold shadow-sm shadow-yellow-400/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  TypeScript / SDK
                </button>
                <button
                  onClick={() => setActiveTab("badge")}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === "badge"
                      ? "bg-yellow-400 text-black font-bold shadow-sm shadow-yellow-400/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  README Badge
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="relative">
              {activeTab === "mcp" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Add to <code className="text-yellow-300">claude_desktop_config.json</code> in Cursor or Claude Desktop:
                    </span>
                    <button
                      onClick={() => copyToClipboard(mcpConfig, "mcp_code")}
                      className="inline-flex items-center gap-1 text-yellow-400 hover:text-yellow-300"
                    >
                      {copiedKey === "mcp_code" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                    {mcpConfig}
                  </pre>
                </div>
              )}

              {activeTab === "curl" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Query agent passport directly from your terminal:</span>
                    <button
                      onClick={() => copyToClipboard(curlCommand, "curl_code")}
                      className="inline-flex items-center gap-1 text-yellow-400 hover:text-yellow-300"
                    >
                      {copiedKey === "curl_code" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Command</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                    {curlCommand}
                  </pre>
                </div>
              )}

              {activeTab === "sdk" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Resolve agent address dynamically in your client or backend:</span>
                    <button
                      onClick={() => copyToClipboard(sdkCode, "sdk_code")}
                      className="inline-flex items-center gap-1 text-yellow-400 hover:text-yellow-300"
                    >
                      {copiedKey === "sdk_code" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                    {sdkCode}
                  </pre>
                </div>
              )}

              {activeTab === "badge" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Embed live trust badge into your GitHub README.md:</span>
                    <button
                      onClick={() => copyToClipboard(badgeMarkdown, "badge_code")}
                      className="inline-flex items-center gap-1 text-yellow-400 hover:text-yellow-300"
                    >
                      {copiedKey === "badge_code" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Markdown</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono">Preview:</span>
                    <img
                      src={`/api/v1/badge/${encodeURIComponent(agent.primaryAddress)}`}
                      alt="AID Badge"
                      className="h-5"
                    />
                  </div>
                  <pre className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                    {badgeMarkdown}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Passport Footer */}
        <div className="bg-slate-950 border-t border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span>ISSUED AT: {new Date(agent.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>PROTOCOL: AID/1.0</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/#verify"
              className="text-slate-400 hover:text-slate-200 transition underline underline-offset-4"
            >
              Signature Verifier
            </Link>
            <span>•</span>
            <Link
              href="/"
              className="text-yellow-400 hover:text-yellow-300 transition font-semibold"
            >
              AID Protocol Registry
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
