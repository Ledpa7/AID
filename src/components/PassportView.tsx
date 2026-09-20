"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
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
} from "lucide-react";
import { Agent, ResolutionResponse } from "@/lib/types";

interface PassportViewProps {
  agent: Agent;
  resolution: ResolutionResponse;
  domainUrl: string;
}

export default function PassportView({ agent, resolution, domainUrl }: PassportViewProps) {
  const [activeTab, setActiveTab] = useState<"mcp" | "curl" | "sdk" | "badge">("mcp");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-900/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Navigation Top Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-lg backdrop-blur"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>레지스트리 탐색기 홈으로</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(typeof window !== "undefined" ? window.location.href : "", "url")}
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            {copiedKey === "url" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">링크 복사됨</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>여권 공유하기</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Digital Passport Document Card */}
      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-10 relative">
        {/* Passport Top Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono tracking-widest text-indigo-400 uppercase font-semibold">
                AID Official Passport
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Decentralized AI Agent Identity & Trust Attestation
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {agent.status}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
              {agent.visibility}
            </span>
          </div>
        </div>

        {/* Passport Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Identity Core */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {agent.displayName}
              </h1>
              <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                {agent.description || "No official description published for this agent."}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
                  <span className="text-xs text-slate-500 font-mono">Address:</span>
                  <span className="text-sm font-mono font-semibold text-emerald-400">
                    {agent.primaryAddress}
                  </span>
                  <button
                    onClick={() => copyToClipboard(agent.primaryAddress, "address")}
                    className="text-slate-500 hover:text-slate-300 transition"
                    title="주소 복사"
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
                    title="AID ID 복사"
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

          {/* 3 Pillars of Trust Evidence */}
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
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
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
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
                    ? "DNS TXT 레코드를 통해 소유권이 수학적으로 검증되었습니다."
                    : "도메인 DNS 인증이 아직 완료되지 않았습니다."}
                </div>
              </div>

              {/* Pillar 2: Cryptographic Key */}
              <div
                className={`p-4 rounded-xl border ${
                  resolution.verification.key
                    ? "bg-indigo-950/20 border-indigo-500/30"
                    : "bg-slate-950 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ed25519 Key</span>
                  </span>
                  {resolution.verification.key ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-400 font-medium">
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
                    {resolution.publicKey || "공개키 미등록"}
                  </span>
                  {resolution.publicKey && (
                    <button
                      onClick={() => copyToClipboard(resolution.publicKey || "", "pubkey")}
                      className="ml-1 text-slate-500 hover:text-slate-200"
                      title="공개키 복사"
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
                  에이전트의 메시지 위변조 방지 전자서명에 사용되는 공개키입니다.
                </div>
              </div>

              {/* Pillar 3: Namespace Authority */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
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
                  공식 네임스페이스 울타리 내에서 격리되어 관리됩니다.
                </div>
              </div>
            </div>
          </div>

          {/* Communication Endpoints */}
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Communication Endpoints</span>
            </h2>

            <div className="space-y-2">
              {resolution.endpoints.map((ep, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="uppercase font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/60 text-[10px]">
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
                    title="URL 복사"
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

          {/* Interactive Developer Quickstart */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
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
                      ? "bg-indigo-600 text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Cursor / Claude (MCP)
                </button>
                <button
                  onClick={() => setActiveTab("curl")}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === "curl"
                      ? "bg-indigo-600 text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveTab("sdk")}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === "sdk"
                      ? "bg-indigo-600 text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  TypeScript / SDK
                </button>
                <button
                  onClick={() => setActiveTab("badge")}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === "badge"
                      ? "bg-indigo-600 text-white font-medium"
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
                      Cursor나 Claude Desktop의 <code className="text-indigo-300">claude_desktop_config.json</code>에 추가하세요:
                    </span>
                    <button
                      onClick={() => copyToClipboard(mcpConfig, "mcp_code")}
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                    >
                      {copiedKey === "mcp_code" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>복사됨!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>JSON 복사</span>
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
                    <span>터미널에서 직접 에이전트 여권 정보를 조회합니다:</span>
                    <button
                      onClick={() => copyToClipboard(curlCommand, "curl_code")}
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                    >
                      {copiedKey === "curl_code" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>복사됨!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>명령어 복사</span>
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
                    <span>클라이언트 사이드 또는 백엔드에서 주소를 동적으로 해석합니다:</span>
                    <button
                      onClick={() => copyToClipboard(sdkCode, "sdk_code")}
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                    >
                      {copiedKey === "sdk_code" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>복사됨!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>코드 복사</span>
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
                    <span>GitHub README.md에 붙여넣어 검증 뱃지를 표시하세요:</span>
                    <button
                      onClick={() => copyToClipboard(badgeMarkdown, "badge_code")}
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                    >
                      {copiedKey === "badge_code" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>복사됨!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>마크다운 복사</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono">미리보기:</span>
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
              전자서명 검증기
            </Link>
            <span>•</span>
            <Link
              href="/"
              className="text-indigo-400 hover:text-indigo-300 transition font-semibold"
            >
              AID Protocol Registry
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
