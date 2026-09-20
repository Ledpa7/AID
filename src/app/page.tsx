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
  ArrowRight,
  Sparkles,
  Lock,
  Zap,
  Layers,
  Code2,
  ChevronRight,
} from "lucide-react";
import { Agent, Namespace, ResolutionResponse } from "@/lib/types";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all");
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);
  const [copiedAid, setCopiedAid] = useState<string | null>(null);
  const [resolveAddress, setResolveAddress] = useState("");
  const [resolveResult, setResolveResult] = useState<ResolutionResponse | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [badgeCopied, setBadgeCopied] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);
  const [heroCurlCopied, setHeroCurlCopied] = useState(false);
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [mcpCopied, setMcpCopied] = useState(false);

  // Modal State for Agent Registration
  const [showModal, setShowModal] = useState(false);
  const [newNamespace, setNewNamespace] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEndpoint, setNewEndpoint] = useState("");
  const [newProtocol, setNewProtocol] = useState<"a2a" | "mcp" | "rest">("a2a");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Domain Verification Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingNs, setVerifyingNs] = useState<Namespace | null>(null);
  const [verifyChallenge, setVerifyChallenge] = useState<any>(null);
  const [isFetchingChallenge, setIsFetchingChallenge] = useState(false);
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");
  const [dnsCopied, setDnsCopied] = useState<string | null>(null);

  const handleOpenVerifyModal = async (ns: Namespace) => {
    setVerifyingNs(ns);
    setShowVerifyModal(true);
    setVerifyError("");
    setVerifySuccess("");
    setIsFetchingChallenge(true);
    try {
      const res = await fetch(`/api/v1/namespaces/${ns.slug}/verify`);
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Failed to load verification challenge.");
      } else {
        setVerifyChallenge(data);
      }
    } catch (err: any) {
      setVerifyError(err.message || "Network error fetching challenge.");
    } finally {
      setIsFetchingChallenge(false);
    }
  };

  const handleRunDnsVerification = async () => {
    if (!verifyingNs) return;
    setIsVerifyingDns(true);
    setVerifyError("");
    setVerifySuccess("");
    try {
      const res = await fetch(`/api/v1/namespaces/${verifyingNs.slug}/verify`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "DNS verification failed.");
      } else {
        setVerifySuccess(data.message || "Domain successfully verified!");
        fetchData();
      }
    } catch (err: any) {
      setVerifyError(err.message || "Error running DNS verification.");
    } finally {
      setIsVerifyingDns(false);
    }
  };

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
        setResolveAddress(`${newAlias}@${selectedNs}`);
        handleResolve(`${newAlias}@${selectedNs}`);
      }
    } catch (err: any) {
      setFormError(err.message || "Error submitting form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAgents = agents.filter((a) => {
    const matchesSearch =
      searchQuery === "" ||
      a.primaryAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesNamespace =
      selectedNamespace === "all" ||
      a.namespaceSlug.toLowerCase() === selectedNamespace.toLowerCase();

    return matchesSearch && matchesNamespace;
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      {/* Glow Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-yellow-500/15 via-amber-500/10 to-transparent blur-[130px] rounded-full" />
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
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#registry" className="hover:text-white transition-colors">
              Agent Registry
            </a>
            <a
              href="https://github.com/Ledpa7/AID"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Documentation</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowMcpModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>MCP Server</span>
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

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center lg:text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-xs font-medium text-yellow-300">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>One Universal ID for Every AI Agent</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              The Universal ID for{" "}
              <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-500 bg-clip-text text-transparent">
                AI Agents.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
              Just like an email address, connect directly to verified AI agents like{" "}
              <code className="text-yellow-300 bg-yellow-950/40 px-1.5 py-0.5 rounded font-mono text-sm border border-yellow-800/40">
                scout@github
              </code>{" "}
              across any app or workflow. No fake bots, zero complex setup.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <a
                href="#registry"
                className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-sm font-semibold shadow-lg shadow-yellow-400/20 transition-all flex items-center gap-2"
              >
                <span>Explore Live Registry</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-sm font-medium transition flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-slate-400" />
                <span>Register Agent</span>
              </button>

              <button
                onClick={() => {
                  const cmd = "curl -sL https://aid-beryl.vercel.app/scout@github";
                  navigator.clipboard.writeText(cmd);
                  setHeroCurlCopied(true);
                  setTimeout(() => setHeroCurlCopied(false), 2000);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono transition flex items-center gap-2"
              >
                <Terminal className="w-3.5 h-3.5 text-yellow-400" />
                <span>curl .../scout@github</span>
                {heroCurlCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            </div>

            {/* Value Props Pills */}
            <div className="pt-6 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Zero Fake Bots</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Verified via real website domains</p>
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Private & Direct</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">We never touch your data or keys</p>
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Universal Interoperability</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Native MCP, REST, &amp; A2A protocols</p>
              </div>
            </div>
          </div>

          {/* Hero Right Visual: Interactive Live Card Preview */}
          <div className="lg:col-span-5 w-full">
            <div className="relative rounded-2xl bg-gradient-to-b from-slate-800/60 to-[#0f172a] border border-slate-800 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">aid-protocol // live passport</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ACTIVE
                </span>
              </div>

              {/* Passport Header Preview */}
              <div className="mt-4 space-y-3 font-mono text-xs">
                <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">Primary Address</span>
                    <span className="text-yellow-400 font-bold text-sm">scout@github</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">Permanent AID</span>
                    <span className="text-emerald-400 text-[11px]">aid_01M30DW5MS43TTBR0BBS3KRSZ4</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">Domain Authority</span>
                    <span className="text-slate-300 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      github.com (Verified)
                    </span>
                  </div>
                </div>

                {/* Evidence tags */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">MCP / REST Endpoint</div>
                    <div className="text-slate-300 truncate mt-0.5 font-sans">https://aid-beryl.vercel.app/api/agents/github</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Cryptographic Key</div>
                    <div className="text-slate-300 truncate mt-0.5">Ed25519 (Verified)</div>
                  </div>
                </div>

                {/* Simulated CLI prompt */}
                <div className="p-3 bg-black/70 rounded-lg border border-slate-800/80 text-[11px] text-slate-300">
                  <div className="text-slate-500">$ curl -sL aid-beryl.vercel.app/scout@github</div>
                  <div className="text-yellow-400 mt-1">✓ Identity resolved in 8ms via Edge CDN</div>
                  <div className="text-slate-400 mt-0.5">✓ Ready for instant tool execution &amp; MCP integration</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-yellow-400">
              Simple 3-Step Setup
            </h2>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              How AID Works in 3 Simple Steps
            </p>
            <p className="text-sm text-slate-400">
              AID makes it effortless to discover verified AI agents, verify their creators, and connect directly with total confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-yellow-400/40 transition">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 mb-4 font-bold text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <span>Pick a Clean Handle</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Give your agent a memorable, email-like address like <code className="text-yellow-300 font-mono">bot@yourbrand</code> instead of a fragile, confusing URL that breaks easily.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-amber-400/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4 font-bold text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <span>Prove You're the Real Owner</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add one simple DNS record to your website. Visitors and AI assistants instantly see an official <span className="text-emerald-400 font-medium">Verified</span> badge, stopping impersonators cold.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 font-bold text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <span>Universal Tool Interoperability</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Any developer, autonomous agent, or LLM workflow can look up your handle once and run your agent's tools directly with zero middleman latency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Verified Agent Catalog Section */}
      <section id="registry" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-slate-800/80 gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Verified Agent Directory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Official Agent Registry</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-mono font-medium">
                {filteredAgents.length} Agents Live
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Browse authentic AI agents, verify their identity passports, and connect directly with total confidence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Single Unified Search Bar */}
            <div className="relative min-w-[300px] sm:min-w-[360px]">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search by handle (e.g. scout@github) or AID..."
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
                className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition"
              />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-xs font-bold text-black bg-yellow-400 hover:bg-yellow-300 rounded-xl shadow-sm shadow-yellow-400/20 transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Agent</span>
            </button>
          </div>
        </div>

        {/* Namespace Filter Chips */}
        {namespaces.length > 0 && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 text-xs">
            <span className="text-slate-500 font-medium mr-1">Namespaces:</span>
            <button
              onClick={() => setSelectedNamespace("all")}
              className={`px-3 py-1.5 rounded-lg font-mono transition border ${
                selectedNamespace === "all"
                  ? "bg-yellow-400 text-black font-bold border-yellow-400"
                  : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
              }`}
            >
              All ({agents.length})
            </button>
            {namespaces.map((ns) => (
              <button
                key={ns.id}
                onClick={() => setSelectedNamespace(ns.slug)}
                className={`px-3 py-1.5 rounded-lg font-mono transition border flex items-center gap-1.5 ${
                  selectedNamespace === ns.slug
                    ? "bg-yellow-400 text-black font-bold border-yellow-400"
                    : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                }`}
              >
                <span>@{ns.slug}</span>
                {ns.isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </button>
            ))}
          </div>
        )}

        {/* Clean 3-Column Responsive Grid */}
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
            <p className="text-xs text-slate-500 mt-1">Try searching for 'scout@github', 'aid_01M30...', or 'registry'</p>
          </div>
        )}

        {/* Verified Namespaces Strip */}
        <div className="mt-16 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Own a Domain? Claim Your Verified Namespace</div>
              <div className="text-xs text-slate-400">Prove domain authority with a single DNS TXT record and prevent impersonators.</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {namespaces.filter((n) => !n.isVerified).slice(0, 1).map((ns) => (
              <button
                key={ns.id}
                onClick={() => handleOpenVerifyModal(ns)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium transition flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Verify @{ns.slug}</span>
              </button>
            ))}
            <button
              onClick={() => setShowModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
            >
              Claim New Namespace
            </button>
          </div>
        </div>
      </section>

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
            <a
              href="https://github.com/Ledpa7/AID"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition"
            >
              GitHub Repo
            </a>
            <a href="#how-it-works" className="hover:text-slate-300 transition">
              Protocol Specs
            </a>
            <button
              onClick={() => setShowMcpModal(true)}
              className="hover:text-slate-300 transition"
            >
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
                    placeholder="https://agent.example.com/a2a"
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
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
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-xs font-semibold rounded-lg shadow-sm shadow-yellow-400/20 transition disabled:opacity-50"
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
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-amber-400" />
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
      "command": "npx",
      "args": ["-y", "aid-mcp", "--registry", "${typeof window !== "undefined" ? window.location.origin : "https://aid-beryl.vercel.app"}"]
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
                            args: [
                              "-y",
                              "aid-mcp",
                              "--registry",
                              typeof window !== "undefined" ? window.location.origin : "https://aid-beryl.vercel.app",
                            ],
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
                  <span className="text-amber-400">• resolve_agent:</span>
                  <span className="text-slate-500 text-[11px]">Address → AID, Endpoint, Verification Evidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400">• verify_agent_signature:</span>
                  <span className="text-slate-500 text-[11px]">Validates Ed25519 payload signatures</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400">• search_agents:</span>
                  <span className="text-slate-500 text-[11px]">Search agents by capability or alias</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowMcpModal(false)}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-xs font-semibold rounded-lg shadow-sm shadow-yellow-400/20 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domain Verification Modal */}
      {showVerifyModal && verifyingNs && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Domain DNS Verification</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    @{verifyingNs.slug} • {verifyingNs.domain || "No domain set"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            {isFetchingChallenge ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-yellow-400" />
                <span>Loading DNS verification instructions...</span>
              </div>
            ) : verifyChallenge ? (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  Add the following DNS <span className="text-yellow-400 font-bold font-mono">TXT</span> record at your domain provider (Cloudflare, Route53, GoDaddy, etc.) to prove ownership:
                </p>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Record Type:</span>
                    <span className="text-slate-200 font-bold bg-slate-800 px-2 py-0.5 rounded text-[11px]">TXT</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-500 text-[11px]">Host / Name:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(verifyChallenge.instructions.name);
                          setDnsCopied("name");
                          setTimeout(() => setDnsCopied(null), 2000);
                        }}
                        className="text-yellow-400 hover:text-yellow-300 text-[10px] flex items-center gap-1"
                      >
                        {dnsCopied === "name" ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {dnsCopied === "name" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="bg-slate-950 p-2 rounded text-slate-300 select-all border border-slate-800/80">
                      {verifyChallenge.instructions.name}{" "}
                      <span className="text-slate-500 text-[10px]">
                        ({verifyChallenge.instructions.host})
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-500 text-[11px]">TXT Value:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(verifyChallenge.instructions.value);
                          setDnsCopied("value");
                          setTimeout(() => setDnsCopied(null), 2000);
                        }}
                        className="text-yellow-400 hover:text-yellow-300 text-[10px] flex items-center gap-1"
                      >
                        {dnsCopied === "value" ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {dnsCopied === "value" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="bg-slate-950 p-2 rounded text-emerald-400 select-all border border-slate-800/80 break-all text-[11px]">
                      {verifyChallenge.instructions.value}
                    </div>
                  </div>
                </div>

                {verifySuccess && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg flex items-center gap-2 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{verifySuccess}</span>
                  </div>
                )}

                {verifyError && (
                  <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg flex items-start gap-2 text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div>{verifyError}</div>
                      <p className="text-[11px] text-slate-400">
                        DNS changes can take 1-5 minutes to propagate globally.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Queries Google (8.8.8.8) & Cloudflare (1.1.1.1)
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowVerifyModal(false)}
                      className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Close
                    </button>

                    <button
                      onClick={handleRunDnsVerification}
                      disabled={isVerifyingDns}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isVerifyingDns && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isVerifyingDns ? "Querying DNS..." : "Check DNS Record Now"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-red-400">
                {verifyError || "Unable to load verification details."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
