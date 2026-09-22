"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, PlusCircle, RefreshCw, Cpu, CheckCircle2 } from "lucide-react";
import { Agent, Namespace } from "@/lib/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AgentCard from "@/components/AgentCard";
import RegisterAgentModal from "@/components/RegisterAgentModal";
import McpSetupModal from "@/components/McpSetupModal";

export default function DirectoryPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all");
  const [selectedProtocol, setSelectedProtocol] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showMcpModal, setShowMcpModal] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resNs, resAgents] = await Promise.all([
        fetch("/api/v1/namespaces"),
        fetch("/api/v1/agents"),
      ]);
      const dataNs = await resNs.json();
      const dataAgents = await resAgents.json();

      if (dataNs.namespaces) setNamespaces(dataNs.namespaces);
      if (dataAgents.agents) setAgents(dataAgents.agents);
    } catch (e) {
      console.error("Failed to load directory data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

    const matchesCategory =
      selectedCategory === "all" ||
      (a.category && a.category.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesNamespace && matchesProtocol && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-yellow-500/15 via-amber-500/10 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* Shared Navigation Bar */}
      <Navbar
        agentCount={agents.length}
        activePage="directory"
        onOpenRegister={() => setShowRegisterModal(true)}
        onOpenMcp={() => setShowMcpModal(true)}
      />

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
                onClick={() => setShowRegisterModal(true)}
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
          {/* Search Bar & Protocol Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search by handle (scout@github), AID (aid_01M...), or keyword..."
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

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-500 font-medium mr-1 shrink-0">Category:</span>
            {[
              { id: "all", label: "All" },
              { id: "coding", label: "💻 Coding" },
              { id: "research", label: "📚 Research" },
              { id: "design", label: "🎨 Design" },
              { id: "devops", label: "🛡️ DevOps" },
              { id: "media", label: "🎵 Media" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition border shrink-0 ${
                  selectedCategory === cat.id
                    ? "bg-amber-400/20 text-amber-300 border-amber-400/60 shadow-sm"
                    : "bg-slate-950/80 text-slate-400 border-slate-850 hover:text-white hover:border-slate-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Namespaces Filter */}
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
          {(searchQuery || selectedNamespace !== "all" || selectedProtocol !== "all" || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedNamespace("all");
                setSelectedProtocol("all");
                setSelectedCategory("all");
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
            <AgentCard key={agent.id} agent={agent} />
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

      {/* Shared Footer */}
      <Footer onOpenMcp={() => setShowMcpModal(true)} />

      {/* Modals */}
      <RegisterAgentModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        namespaces={namespaces}
        onSuccess={fetchData}
      />

      <McpSetupModal isOpen={showMcpModal} onClose={() => setShowMcpModal(false)} />
    </div>
  );
}
