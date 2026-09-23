"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, PlusCircle, RefreshCw, Cpu, CheckCircle2, ChevronDown } from "lucide-react";
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
  const [selectedMinTrust, setSelectedMinTrust] = useState<string>("all");

  // Pagination states
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showMcpModal, setShowMcpModal] = useState(false);

  // Initial load of namespaces
  useEffect(() => {
    fetch("/api/v1/namespaces")
      .then((res) => res.json())
      .then((data) => {
        if (data.namespaces) setNamespaces(data.namespaces);
      })
      .catch((err) => console.error("Failed to load namespaces:", err));
  }, []);

  // Fetch agents with cursor & filters
  const fetchAgents = useCallback(
    async (cursor?: string | null, isAppend = false) => {
      if (isAppend) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const params = new URLSearchParams({ limit: "10" });
        if (cursor) params.set("cursor", cursor);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        if (selectedNamespace !== "all") params.set("namespace", selectedNamespace);
        if (selectedProtocol !== "all") params.set("protocol", selectedProtocol);
        if (selectedCategory !== "all") params.set("category", selectedCategory);
        if (selectedMinTrust !== "all") params.set("min_trust", selectedMinTrust);

        const res = await fetch(`/api/v1/agents?${params.toString()}`);
        const data = await res.json();

        if (isAppend) {
          setAgents((prev) => [...prev, ...(data.agents || [])]);
        } else {
          setAgents(data.agents || []);
        }

        setTotalCount(data.total ?? 0);
        setHasMore(!!data.hasMore);
        setNextCursor(data.nextCursor || null);
      } catch (e) {
        console.error("Failed to load directory data:", e);
      } finally {
        if (isAppend) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [searchQuery, selectedNamespace, selectedProtocol, selectedCategory, selectedMinTrust]
  );

  // Trigger search with 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAgents(null, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchAgents]);

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      fetchAgents(nextCursor, true);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedNamespace("all");
    setSelectedProtocol("all");
    setSelectedCategory("all");
    setSelectedMinTrust("all");
  };

  const isFiltered =
    searchQuery !== "" ||
    selectedNamespace !== "all" ||
    selectedProtocol !== "all" ||
    selectedCategory !== "all" ||
    selectedMinTrust !== "all";

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-yellow-500/15 via-amber-500/10 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* Shared Navigation Bar */}
      <Navbar
        agentCount={totalCount || agents.length}
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
                  {totalCount} Total
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Discover, inspect, and connect directly to authentic AI agents across the decentralized registry.
                Search by memorable handle or permanent cryptographic AID.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchAgents(null, false)}
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

          {/* Trust Level Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-500 font-medium mr-1 shrink-0">Trust Level:</span>
            {[
              { id: "all", label: "All Levels" },
              { id: "1", label: "Lv.1+ 🔑 Key" },
              { id: "2", label: "Lv.2+ 🌐 Domain" },
              { id: "3", label: "Lv.3+ 🛡️ Shield" },
              { id: "4", label: "Lv.4 ⚡ Live" },
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setSelectedMinTrust(lvl.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition border shrink-0 ${
                  selectedMinTrust === lvl.id
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                    : "bg-slate-950/80 text-slate-400 border-slate-850 hover:text-white hover:border-slate-700"
                }`}
              >
                {lvl.label}
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
                All
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
            Showing <strong className="text-slate-200">{agents.length}</strong> of{" "}
            <strong className="text-slate-200">{totalCount}</strong> registered agents
            {hasMore && (
              <span className="ml-2 text-yellow-400/90 font-mono">
                (+{totalCount - agents.length} more available)
              </span>
            )}
          </span>
          {isFiltered && (
            <button onClick={handleResetFilters} className="text-yellow-400 hover:underline">
              Reset filters
            </button>
          )}
        </div>

        {/* 3-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        {/* Load More Button (10-agent chunk pagination) */}
        {hasMore && (
          <div className="flex justify-center mt-12 mb-6">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-yellow-400/50 text-sm font-semibold text-slate-200 hover:text-white transition flex items-center gap-2.5 shadow-lg group disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-yellow-400" />
                  <span>불러오는 중...</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-yellow-400 group-hover:translate-y-0.5 transition" />
                  <span>더 보기 (+10개 더 불러오기)</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 font-mono ml-1">
                    {totalCount - agents.length}개 남음
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* All Loaded Indicator */}
        {!hasMore && agents.length > 0 && totalCount > 10 && (
          <div className="text-center mt-12 mb-6 text-xs text-slate-500 font-mono">
            ✓ 모든 에이전트 목록을 불러왔습니다 (총 {totalCount}개)
          </div>
        )}

        {/* Empty Search State */}
        {!isLoading && agents.length === 0 && (
          <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
            <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No agents match your query</p>
            <p className="text-xs text-slate-500 mt-1">
              Try searching for &apos;scout@github&apos;, &apos;aid_01M30...&apos;, or clearing your filters.
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
        onSuccess={() => fetchAgents(null, false)}
      />

      <McpSetupModal isOpen={showMcpModal} onClose={() => setShowMcpModal(false)} />
    </div>
  );
}
