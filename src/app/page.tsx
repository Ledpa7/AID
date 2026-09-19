"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Globe,
  KeyRound,
  Cpu,
  Server,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Terminal,
  Copy,
  Check,
} from "lucide-react";
import { Agent, Namespace, ResolutionResponse } from "@/lib/types";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [resolveAddress, setResolveAddress] = useState("");
  const [resolveResult, setResolveResult] = useState<ResolutionResponse | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [badgeCopied, setBadgeCopied] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [mcpCopied, setMcpCopied] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newNamespace, setNewNamespace] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEndpoint, setNewEndpoint] = useState("");
  const [newProtocol, setNewProtocol] = useState<"a2a" | "mcp" | "rest">("a2a");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      const [resAgents, resNs] = await Promise.all([
        fetch("/api/v1/agents"),
        fetch("/api/v1/namespaces"),
      ]);
      const dataAgents = await resAgents.json();
      const dataNs = await resNs.json();
      if (dataNs.namespaces) {
        setNamespaces(dataNs.namespaces);
        if (dataNs.namespaces.length > 0 && !newNamespace) {
          setNewNamespace(dataNs.namespaces[0].slug);
        }
      }
      if (dataAgents.agents) {
        setAgents(dataAgents.agents);
        if (dataAgents.agents.length > 0 && !resolveAddress) {
          setResolveAddress(dataAgents.agents[0].primaryAddress);
          handleResolve(dataAgents.agents[0].primaryAddress);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolve = async (target?: string) => {
    const addr = target || resolveAddress;
    if (!addr) return;
    setIsResolving(true);
    setResolveError("");
    try {
      const res = await fetch(`/api/v1/resolve/${encodeURIComponent(addr)}`);
      const data = await res.json();
      if (!res.ok) {
        setResolveError(data.error || "Failed to resolve address");
        setResolveResult(null);
      } else {
        setResolveResult(data);
      }
    } catch (err: any) {
      setResolveError(err.message || "Network error");
      setResolveResult(null);
    } finally {
      setIsResolving(false);
    }
  };

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const selectedNs = (newNamespace || "aid").toLowerCase().replace(/^@/, "");
      // If namespace doesn't exist yet, auto-create it
      const nsExists = namespaces.some((ns) => ns.slug.toLowerCase() === selectedNs);
      if (!nsExists) {
        await fetch("/api/v1/namespaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: selectedNs, name: `${selectedNs} Namespace` }),
        });
      }

      const res = await fetch("/api/v1/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace: selectedNs,
          alias: newAlias,
          displayName: newDisplayName,
          description: newDescription,
          endpointUrl: newEndpoint,
          protocol: newProtocol,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to register agent");
      } else {
        setShowModal(false);
        setNewAlias("");
        setNewDisplayName("");
        setNewDescription("");
        setNewEndpoint("");
        fetchData();
        // Automatically resolve the newly registered agent
        setResolveAddress(`${newAlias}@${selectedNs}`);
        handleResolve(`${newAlias}@${selectedNs}`);
      }
    } catch (err: any) {
      setFormError(err.message || "Error submitting form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.primaryAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between pb-8 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">AID</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  v0.1 MVP
                </span>
              </div>
              <p className="text-sm text-slate-400">AI Agent Identity & Trust Infrastructure</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMcpModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <Cpu className="w-4 h-4 text-purple-400" />
            MCP Server
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Register Agent
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Live Resolver Console (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0f172a]/70 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Live Agent Resolver
              </div>
              <span className="text-[11px] text-slate-400 font-mono">GET /v1/resolve/:address</span>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Enter Agent Address (e.g. registry@aid)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={resolveAddress}
                  onChange={(e) => setResolveAddress(e.target.value)}
                  placeholder="alias@namespace"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  onClick={() => handleResolve()}
                  disabled={isResolving}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition flex items-center gap-1.5"
                >
                  {isResolving ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  ) : (
                    "Resolve"
                  )}
                </button>
              </div>
              {agents.length > 0 ? (
                <div className="flex gap-2 mt-2 items-center flex-wrap">
                  <span className="text-xs text-slate-500">Quick tests:</span>
                  {agents.slice(0, 3).map((a, idx) => (
                    <span key={a.id} className="inline-flex items-center gap-2">
                      {idx > 0 && <span className="text-xs text-slate-600">|</span>}
                      <button
                        onClick={() => {
                          setResolveAddress(a.primaryAddress);
                          handleResolve(a.primaryAddress);
                        }}
                        className="text-xs text-indigo-400 hover:underline font-mono"
                      >
                        {a.primaryAddress}
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-2">
                  No agents registered yet. Register your first agent to begin!
                </p>
              )}
            </div>

            {/* Resolve Result View */}
            {resolveError && (
              <div className="mt-4 p-3 rounded-lg bg-red-950/40 border border-red-800/50 flex items-start gap-2 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>{resolveError}</div>
              </div>
            )}

            {!resolveResult && !resolveError && !isResolving && (
              <div className="mt-4 p-6 rounded-lg bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                Enter an address above or select an agent from the catalog to resolve its verifiable identity passport.
              </div>
            )}

            {resolveResult && (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Permanent AID:</span>
                    <span className="font-mono font-medium text-emerald-400">{resolveResult.aid}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Primary Endpoint:</span>
                    <span className="font-mono text-slate-300 truncate max-w-[200px]" title={resolveResult.primaryEndpoint?.url}>
                      {resolveResult.primaryEndpoint?.url}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Protocol:</span>
                    <span className="uppercase px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-indigo-300">
                      {resolveResult.primaryEndpoint?.protocol}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Trust Evidence:</span>
                    <div className="flex gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 ${resolveResult.verification.domain ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"}`}>
                        Domain {resolveResult.verification.domain ? "✓" : "✗"}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 ${resolveResult.verification.key ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-800 text-slate-400"}`}>
                        Ed25519 {resolveResult.verification.key ? "✓" : "✗"}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Badge Preview & Copy Actions */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">GitHub Badge:</span>
                      <img
                        src={`/api/v1/badge/${encodeURIComponent(resolveResult.address)}`}
                        alt="AID Badge"
                        className="h-5"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          const origin = typeof window !== "undefined" ? window.location.origin : "https://aid.dev";
                          const badgeMd = `[![AID Verified](${origin}/api/v1/badge/${resolveResult.address})](${origin}/${resolveResult.address})`;
                          navigator.clipboard.writeText(badgeMd);
                          setBadgeCopied(true);
                          setTimeout(() => setBadgeCopied(false), 2000);
                        }}
                        className="flex-1 py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition"
                      >
                        {badgeCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Badge Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Copy Badge Markdown</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          const origin = typeof window !== "undefined" ? window.location.origin : "https://aid.dev";
                          const cmd = `curl -sL ${origin}/${resolveResult.address}`;
                          navigator.clipboard.writeText(cmd);
                          setCurlCopied(true);
                          setTimeout(() => setCurlCopied(false), 2000);
                        }}
                        className="flex-1 py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition"
                      >
                        {curlCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">cURL Copied!</span>
                          </>
                        ) : (
                          <>
                            <Terminal className="w-3 h-3 text-slate-400" />
                            <span>Copy cURL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Raw JSON */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 overflow-x-auto max-h-56 text-[11px] font-mono text-slate-300">
                  <pre>{JSON.stringify(resolveResult, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Namespaces Widget */}
          <div className="bg-[#0f172a]/70 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              Claimed Namespaces
            </h3>
            <div className="space-y-2">
              {namespaces.map((ns) => (
                <div
                  key={ns.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-indigo-400">@{ns.slug}</span>
                    <span className="text-xs text-slate-400 truncate max-w-[140px]">{ns.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </div>
                </div>
              ))}
              {namespaces.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-500">
                  No claimed namespaces yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Agent Registry Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search registered agents by address, AID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-400 self-center">
              Total Agents: <span className="font-bold text-white">{filteredAgents.length}</span>
            </div>
          </div>

          <div className="space-y-3">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-[#0f172a]/70 backdrop-blur border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-indigo-400">
                        {agent.primaryAddress}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {agent.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-200 mt-1">{agent.displayName}</h4>
                    {agent.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{agent.description}</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setResolveAddress(agent.primaryAddress);
                      handleResolve(agent.primaryAddress);
                    }}
                    className="shrink-0 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition"
                  >
                    Resolve
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Server className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-slate-500">AID:</span>
                    <span className="font-mono text-slate-300 text-[11px] truncate">{agent.id}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-slate-500">Endpoint:</span>
                    <span className="font-mono text-slate-300 text-[11px] truncate max-w-[180px]">
                      {agent.endpoints[0]?.url || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredAgents.length === 0 && (
              <div className="text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl">
                <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No agents found matching your query.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Register New AI Agent</h3>
            <p className="text-xs text-slate-400 mb-4">
              Issue a permanent AID and verifiable address on the registry.
            </p>

            {formError && (
              <div className="mb-4 p-2.5 rounded bg-red-950/40 border border-red-800/50 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleRegisterAgent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Namespace (@slug)
                  </label>
                  {namespaces.length > 0 ? (
                    <select
                      value={newNamespace}
                      onChange={(e) => setNewNamespace(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
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
                      value={newNamespace}
                      onChange={(e) => setNewNamespace(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Agent Alias</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. planner"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autonomous Task Planner"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Capabilities, scope, or LLM runtime..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Endpoint Target URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://agent.example.com/a2a"
                    value={newEndpoint}
                    onChange={(e) => setNewEndpoint(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Protocol</label>
                  <select
                    value={newProtocol}
                    onChange={(e) => setNewProtocol(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="a2a">A2A</option>
                    <option value="mcp">MCP</option>
                    <option value="rest">REST</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Registering..." : "Issue AID & Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MCP Server Integration Modal */}
      {showMcpModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AID MCP Server</h3>
                  <p className="text-xs text-slate-400">Model Context Protocol Integration</p>
                </div>
              </div>
              <button
                onClick={() => setShowMcpModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Connect Claude Desktop, Cursor, or any MCP-compatible agent to resolve and verify agents directly via tool calling.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Claude Desktop Config:</span>
                <span className="text-[11px] font-mono text-slate-500">claude_desktop_config.json</span>
              </div>

              <div className="relative">
                <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto">
{`{
  "mcpServers": {
    "aid": {
      "command": "node",
      "args": ["${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/bin/aid-mcp.js"]
    }
  }
}`}
                </pre>
                <button
                  onClick={() => {
                    const cfg = JSON.stringify(
                      {
                        mcpServers: {
                          aid: {
                            command: "npx",
                            args: ["-y", "aid-mcp", "--registry", window.location.origin],
                          },
                        },
                      },
                      null,
                      2
                    );
                    navigator.clipboard.writeText(cfg);
                    setMcpCopied(true);
                    setTimeout(() => setMcpCopied(false), 2000);
                  }}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-[10px] font-medium border border-slate-700 flex items-center gap-1.5 transition"
                >
                  {mcpCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copy Config</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-xs font-semibold text-slate-300 mb-2">Available MCP Tools:</div>
              <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">• resolve_agent:</span>
                  <span className="text-slate-500 text-[11px]">Address → AID, Endpoint, Verification Evidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">• verify_agent_signature:</span>
                  <span className="text-slate-500 text-[11px]">Validates Ed25519 payload signatures</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">• search_agents:</span>
                  <span className="text-slate-500 text-[11px]">Search agents by capability or alias</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowMcpModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/30 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
