"use client";

import { useState } from "react";
import { Namespace } from "@/lib/types";
import {
  ShieldCheck,
  Users,
  Cpu,
  Key,
  Copy,
  Check,
  Terminal,
  Code2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface RegisterAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  namespaces: Namespace[];
  onSuccess: () => void;
}

export default function RegisterAgentModal({
  isOpen,
  onClose,
  namespaces,
  onSuccess,
}: RegisterAgentModalProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "sdk">("manual");

  // Manual Form State
  const [namespace, setNamespace] = useState(namespaces[0]?.slug || "");
  const [alias, setAlias] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [protocol, setProtocol] = useState<"a2a" | "mcp" | "rest">("rest");
  const [registeredBy, setRegisteredBy] = useState<"OWNER" | "COMMUNITY">("COMMUNITY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // SDK / Auto-Enroll Token Generation State
  const [tokenNamespace, setTokenNamespace] = useState(namespaces[0]?.slug || "");
  const [tokenName, setTokenName] = useState("Agent Worker Pool");
  const [tokenMaxAgents, setTokenMaxAgents] = useState(10);
  const [tokenExpiresInDays, setTokenExpiresInDays] = useState(30);
  const [generatedToken, setGeneratedToken] = useState("");
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [tokenError, setTokenError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const selectedNs = namespace || (namespaces[0] && namespaces[0].slug);
      if (!selectedNs) {
        throw new Error("Please select or specify a namespace");
      }

      const res = await fetch("/api/v1/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace: selectedNs,
          alias,
          displayName,
          description,
          registeredBy,
          endpoints: [
            {
              url: endpoint,
              protocol,
              isPrimary: true,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to register agent");
      } else {
        setAlias("");
        setDisplayName("");
        setDescription("");
        setEndpoint("");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setFormError(err.message || "Error submitting form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingToken(true);
    setTokenError("");
    try {
      const selectedNs = tokenNamespace || (namespaces[0] && namespaces[0].slug) || "community";
      const res = await fetch("/api/v1/enrollments/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespaceSlug: selectedNs,
          name: tokenName,
          maxAgents: Number(tokenMaxAgents),
          expiresInDays: Number(tokenExpiresInDays),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTokenError(data.error || "Failed to generate enrollment token.");
      } else {
        setGeneratedToken(data.token);
      }
    } catch (err: any) {
      setTokenError(err.message || "Error creating token.");
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sdkCodeSnippet = `import { AID } from "@/sdk"; // @aid/sdk

// Agent boots up and automatically enrolls with AID
const agentSession = await AID.autoEnroll({
  token: "${generatedToken || "aid_enroll_YOUR_SECRET_TOKEN"}",
  alias: "my-worker",
  displayName: "Autonomous Worker Agent",
  endpointUrl: "https://agent.example.com/api",
  protocol: "a2a", // 'a2a' | 'mcp' | 'rest'
});

console.log("Registered Address:", agentSession.address);
console.log("Permanent AID:", agentSession.aid);`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">Register AI Agent</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
              Phase 3 Live
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-900 border border-slate-800"
          >
            Esc
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 ${
              activeTab === "manual"
                ? "bg-yellow-400 text-black shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>웹 폼 직접 등록</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sdk")}
            className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 ${
              activeTab === "sdk"
                ? "bg-yellow-400 text-black shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Agent 자동 등록 (SDK)</span>
          </button>
        </div>

        {activeTab === "manual" ? (
          <div>
            <p className="text-xs text-slate-400 mb-4">
              기존에 구동 중인 AI Agent의 Endpoint와 주소를 직접 지정하여 등록합니다.
            </p>

            {formError && (
              <div className="mb-4 p-2.5 rounded bg-red-950/40 border border-red-800/50 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Registration Type Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  등록자 구분 (Who are you?)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisteredBy("COMMUNITY")}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                      registeredBy === "COMMUNITY"
                        ? "bg-purple-950/40 border-purple-500/50 text-purple-200"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>추천 / 제보 등록</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      발견한 유용한 에이전트
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisteredBy("OWNER")}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                      registeredBy === "OWNER"
                        ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>공식 소유자 등록</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      직접 만든 에이전트
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Namespace (@slug)
                  </label>
                  {namespaces.length > 0 ? (
                    <select
                      value={namespace || namespaces[0]?.slug}
                      onChange={(e) => setNamespace(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono"
                    >
                      {namespaces.map((ns) => (
                        <option key={ns.id} value={ns.slug}>
                          @{ns.slug}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. aid"
                      value={namespace}
                      onChange={(e) => setNamespace(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Agent Alias</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. scout"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GitHub Code Intelligence Agent"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Capabilities, scope, or LLM runtime..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Endpoint Target URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.domain.com/agent"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Protocol</label>
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono"
                  >
                    <option value="rest">REST</option>
                    <option value="mcp">MCP</option>
                    <option value="a2a">A2A</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-black bg-yellow-400 hover:bg-yellow-300 rounded-xl transition"
                >
                  {isSubmitting ? "Registering..." : "Submit Registration"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              에이전트 런타임이 부팅 시 스스로 AID를 발급받을 수 있도록 권한 위임 토큰(Enrollment Token)을 생성하고 SDK를 연동합니다.
            </p>

            {tokenError && (
              <div className="p-2.5 rounded bg-red-950/40 border border-red-800/50 text-xs text-red-300">
                {tokenError}
              </div>
            )}

            {!generatedToken ? (
              <form onSubmit={handleGenerateToken} className="space-y-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Key className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Step 1: Enrollment Token 발급</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Namespace (@slug)
                    </label>
                    <select
                      value={tokenNamespace || namespaces[0]?.slug}
                      onChange={(e) => setTokenNamespace(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400 font-mono"
                    >
                      {namespaces.map((ns) => (
                        <option key={ns.id} value={ns.slug}>
                          @{ns.slug}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      토큰 목적 (Token Name)
                    </label>
                    <input
                      type="text"
                      required
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      최대 등록 쿼터 (Max Agents)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={tokenMaxAgents}
                      onChange={(e) => setTokenMaxAgents(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      유효 기간 (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={tokenExpiresInDays}
                      onChange={(e) => setTokenExpiresInDays(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingToken}
                  className="w-full py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isGeneratingToken ? "Generating..." : "토큰 생성하기"}</span>
                </button>
              </form>
            ) : (
              <div className="space-y-3.5 bg-slate-950/80 p-4 rounded-xl border border-yellow-400/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>발급된 Enrollment Token</span>
                  </span>
                  <span className="text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                    단 1회만 표시됩니다
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs">
                  <span className="text-yellow-300 truncate select-all">{generatedToken}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedToken, setTokenCopied)}
                    className="p-1 text-slate-400 hover:text-white shrink-0"
                    title="Copy token"
                  >
                    {tokenCopied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: SDK Quickstart Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-yellow-400" />
                  <span>에이전트 런타임 코드 (SDK Quickstart)</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(sdkCodeSnippet, setCodeCopied)}
                  className="text-[11px] text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                >
                  {codeCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                <code>{sdkCodeSnippet}</code>
              </pre>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
