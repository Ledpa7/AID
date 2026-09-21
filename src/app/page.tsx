"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Globe,
  Lock,
  Zap,
  Copy,
  Check,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  AlertCircle,
  PlusCircle,
  Terminal,
} from "lucide-react";
import { Agent, Namespace } from "@/lib/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AgentCard from "@/components/AgentCard";
import RegisterAgentModal from "@/components/RegisterAgentModal";
import McpSetupModal from "@/components/McpSetupModal";
import VerifyDomainModal from "@/components/VerifyDomainModal";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [heroCurlCopied, setHeroCurlCopied] = useState(false);

  // Modal States
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingNs, setVerifyingNs] = useState<Namespace | null>(null);

  const fetchData = async () => {
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
      console.error("Failed to load initial data:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyHeroCurl = () => {
    navigator.clipboard.writeText("curl -sL https://aid-beryl.vercel.app/scout@github");
    setHeroCurlCopied(true);
    setTimeout(() => setHeroCurlCopied(false), 2000);
  };

  const handleOpenVerifyModal = (ns: Namespace) => {
    setVerifyingNs(ns);
    setShowVerifyModal(true);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      {/* Glow Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-yellow-500/15 via-amber-500/10 to-transparent blur-[130px] rounded-full" />
      </div>

      {/* Shared Navigation Bar */}
      <Navbar
        agentCount={agents.length}
        activePage="home"
        onOpenRegister={() => setShowRegisterModal(true)}
        onOpenMcp={() => setShowMcpModal(true)}
      />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-xs font-medium text-yellow-300">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>One Universal ID for Every AI Agent</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              The Universal ID <br className="hidden sm:inline" />
              for{" "}
              <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-500 bg-clip-text text-transparent whitespace-nowrap">
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
              <Link
                href="/directory"
                className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-sm font-semibold shadow-lg shadow-yellow-400/20 transition-all flex items-center gap-2"
              >
                <span>Explore Directory</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-sm font-medium transition flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-slate-400" />
                <span>Register Agent</span>
              </button>

              <button
                onClick={handleCopyHeroCurl}
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
                  <span>100% Private &amp; Direct</span>
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
            <div className="p-6 rounded-2xl bg-[#0f172a]/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-yellow-400/40 transition">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 mb-4 font-bold text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-2">Pick a Clean Handle</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Give your agent a memorable, email-like address like <code className="text-yellow-300 font-mono">bot@yourbrand</code> instead of a fragile, confusing URL.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-amber-400/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4 font-bold text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-2">Prove Domain Ownership</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add one simple DNS TXT record to your website. Visitors and AI assistants instantly see an official <span className="text-emerald-400 font-medium">Verified</span> badge.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 font-bold text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-2">Connect Directly with Zero Middleman</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Any developer, autonomous agent, or LLM workflow can look up your handle once and run your agent's tools directly with zero middleman latency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Verified Agents Section */}
      <section id="featured" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-slate-800/80 gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Genesis Live Directory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Featured Verified Agents</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-mono font-medium">
                {agents.length} Agents Live
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Top autonomous agents verified with cryptographic identity and ready for instant MCP or REST integration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/directory"
              className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs transition shadow-lg shadow-yellow-400/20 flex items-center gap-2 group shrink-0"
            >
              <span>Explore Full Directory ({agents.length})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Featured 3-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.slice(0, 3).map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        {/* Directory Explorer Banner CTA */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0f172a] to-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Looking for More AI Agents?</div>
              <div className="text-xs text-slate-400">
                Search by handle, filter by protocol (MCP / REST / A2A), or submit your own.
              </div>
            </div>
          </div>
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-black bg-yellow-400 hover:bg-yellow-300 rounded-xl transition shrink-0"
          >
            <span>Open Directory Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Verified Namespaces Strip */}
        <div className="mt-16 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Own a Domain? Claim Your Verified Namespace</div>
              <div className="text-xs text-slate-400">
                Prove domain authority with a single DNS TXT record and prevent impersonators.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {namespaces
              .filter((n) => !n.isVerified)
              .slice(0, 1)
              .map((ns) => (
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
              onClick={() => setShowRegisterModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
            >
              Claim New Namespace
            </button>
          </div>
        </div>
      </section>

      {/* Shared Footer */}
      <Footer onOpenMcp={() => setShowMcpModal(true)} />

      {/* Extracted Modals */}
      <RegisterAgentModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        namespaces={namespaces}
        onSuccess={fetchData}
      />

      <McpSetupModal isOpen={showMcpModal} onClose={() => setShowMcpModal(false)} />

      <VerifyDomainModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        namespace={verifyingNs}
        onSuccess={fetchData}
      />
    </div>
  );
}
