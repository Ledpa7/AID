"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  ArrowLeft,
  Filter,
  Layers,
  Sparkles,
} from "lucide-react";
import { Agent, Namespace, ResolutionResponse } from "@/lib/types";

export default function DirectoryPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all");
  const [selectedProtocol, setSelectedProtocol] = useState<string>("all");
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);
  const [copiedAid, setCopiedAid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [mcpCopied, setMcpCopied] = useState(false);

  // New Agent Form
  const [newNamespace, setNewNamespace] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEndpoint, setNewEndpoint] = useState("");
  const [newProtocol, setNewProtocol] = useState<"a2a" | "mcp" | "rest">("rest");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resNs, resAgents] = await Promise.all([
        fetch("/api/v1/namespaces"),
        fetch("/api/v1/agents"),
      ]);
      const dataNs = await resNs.json();
      const dataAgents = await resAgents.json();

      if (dataNs.namespaces) {
        setNamespaces(dataNs.namespaces);
        if (dataNs.namespaces.length > 0 && !newNamespace) {
          setNewNamespace(dataNs.namespaces[0].slug);
        }
      }
      if (dataAgents.agents) {
        setAgents(dataAgents.agents);
      }
    } catch (e) {
      console.error("Failed to load directory data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const selectedNs = newNamespace || (namespaces[0] && namespaces[0].slug);
      if (!selectedNs) {
        throw new Error("Please select or specify a namespace");
      }

      const res = await fetch("/api/v1/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace: selectedNs,
          alias: newAlias,
          displayName: newDisplayName,
          description: newDescription,
          endpoints: [
            {
              url: newEndpoint,
              protocol: newProtocol,
              isPrimary: true,
            },
          ],
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
      }
    } catch (err: any) {
      setFormError(err.message || "Error submitting form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAgents = agents.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      a.primaryAddress.toLowerCase().includes(q) ||
      a.displayName.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      (a.description && a.description.toLowerCase().includes(q));

    const matchesNamespace =
      selectedNamespace === "all" ||
      a.namespaceSlug.toLowerCase() === selectedNamespace.toLowerCase();

    const matchesProtocol =
      selectedProtocol === "all" ||
      a.endpoints.some((ep) => ep.protocol.toLowerCase() === selectedProtocol.toLowerCase());

    return matchesSearch && matchesNamespace && matchesProtocol;
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-yellow-500/15 via-amber-500/10 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#070b14]/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">AID</span>
              <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-slate-900/90 text-slate-300 border border-slate-800">
                Agent Identity Directory
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <Link href="/directory" className="text-yellow-400 font-semibold transition-colors">
              Directory
            </Link>
            <a
              href="https://github.com/Ledpa7/AID"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowMcpModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>MCP Setup</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-black bg-yellow-400 hover:bg-yellow-300 rounded-lg shadow-sm shadow-yellow-400/20 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Agent</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Directory Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-2">
            <Link href="/" className="hover:text-slate-300 transition">
              Home
            </Link>
            <span>/</span>
            <span className="text-yellow-400">Directory</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <span>Global Agent Directory</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 font-mono font-bold">
                  {agents.length} Live
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Discover, inspect, and connect directly to authentic AI agents across the decentralized registry.
                Search by memorable handle or permanent cryptographic AID.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchData()}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
                title="Refresh Directory"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-yellow-400" : ""}`} />
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 text-xs font-bold text-black bg-yellow-400 hover:bg-yellow-300 rounded-xl shadow-sm shadow-yellow-400/20 transition flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Your Agent</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-[#0f172a]/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 mb-8 backdrop-blur-sm space-y-4">
          {/* Row 1: Search Bar & Protocol Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search by handle (scout@github), AID (aid_01M...), or capability..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    const q = searchQuery.trim();
                    if (q.startsWith("aid_") || q.includes("@")) {
                      window.location.href = `/${encodeURIComponent(q)}`;
                    }
                  }
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition font-mono"
              />
            </div>

            {/* Protocol Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs shrink-0">
              <span className="text-slate-500 font-medium mr-1 hidden sm:inline">Protocol:</span>
              {[
                { id: "all", label: "All" },
                { id: "mcp", label: "MCP" },
                { id: "rest", label: "REST" },
                { id: "a2a", label: "A2A" },
              ].map((proto) => (
                <button
                  key={proto.id}
                  onClick={() => setSelectedProtocol(proto.id)}
                  className={`px-3 py-1.5 rounded-lg font-mono font-medium transition border ${
                    selectedProtocol === proto.id
                      ? "bg-yellow-400 text-black font-bold border-yellow-400"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {proto.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Namespaces Filter */}
          {namespaces.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800/60 text-xs">
              <span className="text-slate-500 font-medium mr-1 shrink-0">Namespaces:</span>
              <button
                onClick={() => setSelectedNamespace("all")}
                className={`px-2.5 py-1 rounded-lg font-mono transition border shrink-0 ${
                  selectedNamespace === "all"
                    ? "bg-slate-800 text-white font-semibold border-slate-600"
                    : "bg-slate-950/80 text-slate-400 border-slate-850 hover:text-white hover:border-slate-700"
                }`}
              >
                All ({agents.length})
              </button>
              {namespaces.map((ns) => (
                <button
                  key={ns.id}
                  onClick={() => setSelectedNamespace(ns.slug)}
                  className={`px-2.5 py-1 rounded-lg font-mono transition border shrink-0 flex items-center gap-1.5 ${
                    selectedNamespace === ns.slug
                      ? "bg-slate-800 text-white font-semibold border-slate-600"
                      : "bg-slate-950/80 text-slate-400 border-slate-850 hover:text-white hover:border-slate-700"
                  }`}
                >
                  <span>@{ns.slug}</span>
                  {ns.isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-6 px-1">
          <span>
            Showing <strong className="text-slate-200">{filteredAgents.length}</strong> of{" "}
            <strong className="text-slate-200">{agents.length}</strong> registered agents
          </span>
          {(searchQuery || selectedNamespace !== "all" || selectedProtocol !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedNamespace("all");
                setSelectedProtocol("all");
              }}
              className="text-yellow-400 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* 3-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="group bg-[#0f172a]/70 hover:bg-[#0f172a] border border-slate-800 hover:border-yellow-400/40 rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-base text-yellow-400">
                      {agent.primaryAddress}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                  <span className="uppercase text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {agent.endpoints[0]?.protocol || "REST"}
                  </span>
                </div>

                {/* Permanent AID Identifier Chip with 1-Click Copy */}
                <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 mb-3 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-slate-500 text-[10px] shrink-0">AID:</span>
                    <Link
                      href={`/${encodeURIComponent(agent.id)}`}
                      className="text-emerald-400/90 hover:text-emerald-300 hover:underline font-medium truncate"
                      title={`Direct AID: ${agent.id} (Click to open passport)`}
                    >
                      {agent.id}
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigator.clipboard.writeText(agent.id);
                      setCopiedAid(agent.id);
                      setTimeout(() => setCopiedAid(null), 2000);
                    }}
                    className="text-slate-500 hover:text-slate-200 transition p-1 shrink-0 ml-1.5 rounded"
                    title="Copy AID"
                  >
                    {copiedAid === agent.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400 hover:text-slate-200" />
                    )}
                  </button>
                </div>

                <h3 className="text-sm font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">
                  {agent.displayName}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-6">
                  {agent.description || "Decentralized autonomous AI agent registered on AID protocol."}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <Link
                  href={`/${encodeURIComponent(agent.primaryAddress)}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-yellow-400/10 hover:bg-yellow-400 text-yellow-400 hover:text-black font-semibold text-xs border border-yellow-400/30 transition flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>View Passport</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(agent.primaryAddress);
                    setCopiedHandle(agent.primaryAddress);
                    setTimeout(() => setCopiedHandle(null), 2000);
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5"
                  title="Copy Handle"
                >
                  {copiedHandle === agent.primaryAddress ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty Search State */}
        {filteredAgents.length === 0 && (
          <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
            <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No agents match your query</p>
            <p className="text-xs text-slate-500 mt-1">
              Try searching for 'scout@github', 'aid_01M30...', or clearing your filters.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 bg-[#05080f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <span>AID • Agent Identity Directory & Trust Infrastructure</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-slate-300 transition">
              Home
            </Link>
            <a
              href="https://github.com/Ledpa7/AID"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition"
            >
              GitHub Repo
            </a>
            <button onClick={() => setShowMcpModal(true)} className="hover:text-slate-300 transition">
              MCP Setup
            </button>
            <span>MIT License</span>
          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
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
                      value={newNamespace}
                      onChange={(e) => setNewNamespace(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono"
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Capabilities, scope, or LLM runtime..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Endpoint Target URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://agent.example.com/api"
                    value={newEndpoint}
                    onChange={(e) => setNewEndpoint(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Protocol</label>
                  <select
                    value={newProtocol}
                    onChange={(e) => setNewProtocol(e.target.value as any)}
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
                  onClick={() => setShowModal(false)}
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
        </div>
      )}

      {/* MCP Integration Modal */}
      {showMcpModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Connect via Model Context Protocol</h3>
              </div>
              <button onClick={() => setShowMcpModal(false)} className="text-slate-500 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Plug the AID official MCP server into Claude Desktop, Cursor, or your autonomous agent runtime.
            </p>

            <div className="p-3 bg-black/80 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 relative">
              <div className="text-slate-500 mb-1">// Run directly with npx</div>
              <code>npx aid-protocol</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("npx aid-protocol");
                  setMcpCopied(true);
                  setTimeout(() => setMcpCopied(false), 2000);
                }}
                className="absolute top-3 right-3 text-slate-400 hover:text-white"
              >
                {mcpCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowMcpModal(false)}
                className="px-4 py-2 text-xs font-bold text-black bg-yellow-400 hover:bg-yellow-300 rounded-xl transition"
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
