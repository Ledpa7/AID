"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Zap, ShieldCheck, Play, ArrowUpRight, Flame, Sparkles } from "lucide-react";
import { Agent } from "@/lib/types";

interface LeaderboardAgent {
  address: string;
  executions: number;
  reputationScore: number;
  averageLatencyMs: number;
  tier: "ELITE" | "RELIABLE" | "UNPROVEN" | "HIGH_RISK";
  successRate: number;
}

interface NetworkStats {
  totalReceipts: number;
  averageLatencyMs: number;
  topAgents: LeaderboardAgent[];
}

interface LeaderboardWidgetProps {
  agents: Agent[];
  onInvokeAgent: (agent: Agent) => void;
}

export default function LeaderboardWidget({ agents, onInvokeAgent }: LeaderboardWidgetProps) {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/attest/receipts")
      .then((res) => res.json())
      .then((data) => {
        if (data.networkStats) {
          setStats(data.networkStats);
        }
      })
      .catch((err) => console.error("Failed to fetch DuckDB leaderboard stats:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const topAgents = stats?.topAgents || [];

  return (
    <div className="mb-10 p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/90 shadow-2xl relative overflow-hidden backdrop-blur-sm">
      {/* Background glow decoration */}
      <div className="absolute top-0 right-1/4 w-72 h-36 bg-yellow-400/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-0 left-10 w-48 h-24 bg-purple-500/5 blur-2xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 shadow-md shadow-yellow-400/10">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Top Rated Agents
            </h2>
            <p className="text-xs text-slate-400">
              Ranked by verified execution volume, sub-second latency &amp; Proof of Execution (PoE) receipts.
            </p>
          </div>
        </div>

        {/* Global Network Metrics */}
        {stats && (
          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-slate-400">PoE Receipts:</span>
              <strong className="text-white font-mono">{stats.totalReceipts}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Avg Latency:</span>
              <strong className="text-white font-mono">{stats.averageLatencyMs}ms</strong>
            </div>
          </div>
        )}
      </div>

      {/* Top 5 Leaderboard List */}
      <div className="mt-4 divide-y divide-slate-800/50">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            Loading real-time DuckDB telemetry...
          </div>
        ) : topAgents.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No attestation receipts recorded yet. Execute agents to populate the leaderboard!
          </div>
        ) : (
          topAgents.map((item, index) => {
            const matchedAgent = agents.find((a) => a.primaryAddress === item.address);
            const rank = index + 1;
            const rankColors =
              rank === 1
                ? "bg-yellow-400/20 text-yellow-300 border-yellow-400/40"
                : rank === 2
                ? "bg-slate-300/20 text-slate-200 border-slate-300/40"
                : rank === 3
                ? "bg-amber-600/20 text-amber-300 border-amber-600/40"
                : "bg-slate-800/50 text-slate-400 border-slate-800";

            return (
              <div
                key={item.address}
                className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/60 rounded-xl transition duration-150 group"
              >
                {/* Left: Rank & Agent Identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-mono font-bold shrink-0 ${rankColors}`}
                  >
                    #{rank}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/${encodeURIComponent(item.address)}`}
                        className="font-mono text-sm font-semibold text-white hover:text-yellow-400 transition truncate flex items-center gap-1"
                      >
                        <span>{item.address}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                      </Link>

                      {matchedAgent?.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                          {matchedAgent.category}
                        </span>
                      )}

                      {item.tier === "ELITE" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          ELITE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {matchedAgent?.displayName || "Verified AI Agent"}
                    </p>
                  </div>
                </div>

                {/* Right: Metrics & Run Button */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-between sm:justify-end">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase">Invocations</div>
                      <div className="font-mono font-semibold text-slate-200">
                        {item.executions}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase">Speed</div>
                      <div className="font-mono font-semibold text-emerald-400">
                        {item.averageLatencyMs}ms
                      </div>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <div className="text-[10px] text-slate-500 uppercase">Reputation</div>
                      <div className="font-mono font-bold text-yellow-400">
                        {item.reputationScore}
                        <span className="text-[10px] text-slate-500 font-normal">/100</span>
                      </div>
                    </div>
                  </div>

                  {matchedAgent && (
                    <button
                      onClick={() => onInvokeAgent(matchedAgent)}
                      className="py-1.5 px-3 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs transition flex items-center gap-1 shadow-md shadow-yellow-400/10 cursor-pointer"
                      title={`Run ${item.address} directly via AID Gateway`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Run</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
