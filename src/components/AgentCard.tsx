"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Shield, CheckCircle2, Copy, Check, ExternalLink, Users, Play, Zap } from "lucide-react";
import { Agent } from "@/lib/types";
import { calculateTrustLadder } from "@/lib/trust";

interface AgentCardProps {
  agent: Agent;
  onInvoke?: (agent: Agent) => void;
}

export default function AgentCard({ agent, onInvoke }: AgentCardProps) {
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [copiedAid, setCopiedAid] = useState(false);
  const [sparksCount, setSparksCount] = useState(agent.sparksCount ?? 0);
  const [isSparked, setIsSparked] = useState(false);
  const [isSparking, setIsSparking] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("aid_sparked_agents");
      if (stored) {
        const list: string[] = JSON.parse(stored);
        if (list.includes(agent.primaryAddress.toLowerCase())) {
          setIsSparked(true);
        }
      }
    } catch {}
  }, [agent.primaryAddress]);

  const handleSpark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSparking) return;

    setIsSparking(true);
    const nextSparked = !isSparked;
    const nextCount = nextSparked ? sparksCount + 1 : Math.max(0, sparksCount - 1);

    // Optimistic Update
    setIsSparked(nextSparked);
    setSparksCount(nextCount);

    try {
      // LocalStorage update
      const stored = localStorage.getItem("aid_sparked_agents");
      let list: string[] = stored ? JSON.parse(stored) : [];
      const key = agent.primaryAddress.toLowerCase();
      if (nextSparked) {
        if (!list.includes(key)) list.push(key);
      } else {
        list = list.filter((k) => k !== key);
      }
      localStorage.setItem("aid_sparked_agents", JSON.stringify(list));

      // Server Sync
      const res = await fetch(`/api/v1/agents/${encodeURIComponent(agent.primaryAddress)}/spark`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setSparksCount(data.sparksCount);
      }
    } catch {
      // Rollback
      setIsSparked(!nextSparked);
      setSparksCount(sparksCount);
    } finally {
      setIsSparking(false);
    }
  };

  const handleCopy = (text: string, type: "handle" | "aid", e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigator.clipboard.writeText(text);
    if (type === "handle") {
      setCopiedHandle(true);
      setTimeout(() => setCopiedHandle(false), 2000);
    } else {
      setCopiedAid(true);
      setTimeout(() => setCopiedAid(false), 2000);
    }
  };

  const primaryProtocol = agent.endpoints[0]?.protocol?.toUpperCase() || "REST";
  const isCommunity = agent.registeredBy === "COMMUNITY";

  return (
    <div className={`group bg-[#0f172a]/70 hover:bg-[#0f172a] border ${agent.isLimited ? "border-red-900/40 hover:border-red-500/40" : isCommunity ? "border-purple-900/30 hover:border-purple-500/40" : "border-slate-800 hover:border-yellow-400/40"} rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between`}>
      <div>
        {/* Header: Handle, Ownership Badge, Protocol */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-mono font-bold text-base ${agent.isLimited ? "text-red-400" : "text-yellow-400"}`}>
              {agent.primaryAddress}
            </span>

            {/* Registration Type Badge: Owner vs Community */}
            {isCommunity ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30"
                title="Community registered agent"
              >
                <Users className="w-3 h-3 text-purple-400" />
                Community Registered
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                title="Registered directly by verified owner"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Verified Owner
              </span>
            )}

            {/* Security Shield Badge */}
            {agent.securityAudit && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                  agent.securityAudit.tier === "DANGEROUS"
                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : agent.securityAudit.tier === "WARNING"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
                title={`Security Shield: ${agent.securityAudit.summary} (Risk Score: ${agent.securityAudit.riskScore})`}
              >
                {agent.securityAudit.tier === "DANGEROUS" ? (
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                ) : agent.securityAudit.tier === "WARNING" ? (
                  <Shield className="w-3 h-3 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                )}
                <span>
                  {agent.securityAudit.tier === "DANGEROUS"
                    ? "Dangerous"
                    : agent.securityAudit.tier === "WARNING"
                    ? "Warning"
                    : "Shield Safe"}
                </span>
              </span>
            )}

            {/* Progressive Trust Ladder Level Pill */}
            {(() => {
              const ladder = agent.trustLadder || calculateTrustLadder(agent);
              return (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    ladder.currentLevel === 4
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : ladder.currentLevel === 3
                      ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                      : ladder.currentLevel === 2
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      : ladder.currentLevel === 1
                      ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                  title={`Trust Ladder: ${ladder.levelLabel} (${ladder.currentLevel}/4 badges unlocked)`}
                >
                  <span className="text-[11px]">{ladder.badges[ladder.currentLevel]?.icon || "⚪"}</span>
                  <span>{ladder.levelLabel}</span>
                </span>
              );
            })()}

            {/* Category Badge */}

            {agent.category && (
              <span
                className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                  agent.category === "Coding"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    : agent.category === "Research"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : agent.category === "Design"
                    ? "bg-pink-500/10 text-pink-400 border-pink-500/30"
                    : agent.category === "DevOps"
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                    : agent.category === "Media"
                    ? "bg-violet-500/10 text-violet-400 border-violet-500/30"
                    : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                }`}
              >
                {agent.category}
              </span>
            )}

            {/* Limited Capability Badge */}
            {agent.isLimited && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                Limited Profile
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* ⚡ Spark Button */}
            <button
              type="button"
              onClick={handleSpark}
              disabled={isSparking}
              title={isSparked ? "Remove Spark" : "Spark this agent with energy!"}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border shrink-0 cursor-pointer ${
                isSparked
                  ? "bg-yellow-400/20 text-yellow-300 border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.3)] scale-105"
                  : "bg-slate-900/90 text-slate-400 border-slate-800 hover:border-yellow-400/60 hover:text-yellow-400 hover:bg-slate-850"
              }`}
            >
              <Zap className={`w-3.5 h-3.5 transition-colors ${isSparked ? "fill-yellow-400 text-yellow-400" : "text-slate-400"}`} />
              <span>{sparksCount}</span>
            </button>

            <span className={`uppercase text-[10px] font-mono px-2 py-1 rounded border shrink-0 ${agent.isLimited ? "bg-red-950/40 text-red-300 border-red-800/40" : "bg-slate-800 text-slate-300 border-slate-700"}`}>
              {agent.isLimited ? "Closed API" : primaryProtocol}
            </span>
          </div>
        </div>

        {/* Permanent AID Chip with 1-Click Copy & Direct Link */}
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
            onClick={(e) => handleCopy(agent.id, "aid", e)}
            className="text-slate-500 hover:text-slate-200 transition p-1 shrink-0 ml-1.5 rounded"
            title="Copy AID"
          >
            {copiedAid ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-slate-400 hover:text-slate-200" />
            )}
          </button>
        </div>

        {/* Display Name & Description */}
        <h3 className={`text-sm font-bold mb-2 transition-colors ${agent.isLimited ? "text-red-400 group-hover:text-red-300" : "text-white group-hover:text-yellow-300"}`}>
          {agent.displayName}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-6">
          {agent.description || "Decentralized autonomous AI agent registered on AID protocol."}
        </p>
      </div>

      {/* Footer: View Passport, Run & Copy Handle Buttons */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <Link
          href={`/${encodeURIComponent(agent.primaryAddress)}`}
          className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-800 transition flex items-center justify-center gap-1.5"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
          <span>Passport</span>
          <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
        </Link>

        {onInvoke && (
          <button
            onClick={() => onInvoke(agent)}
            className="py-2 px-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1 shadow-md shadow-yellow-400/10 cursor-pointer"
            title="Invoke agent directly via AID Gateway"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run</span>
          </button>
        )}

        <button
          onClick={() => handleCopy(agent.primaryAddress, "handle")}
          className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
          title="Copy Handle"
        >
          {copiedHandle ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>
      </div>
    </div>
  );
}
