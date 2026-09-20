"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, Copy, Check, ExternalLink } from "lucide-react";
import { Agent } from "@/lib/types";

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [copiedAid, setCopiedAid] = useState(false);

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

  return (
    <div className="group bg-[#0f172a]/70 hover:bg-[#0f172a] border border-slate-800 hover:border-yellow-400/40 rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between">
      <div>
        {/* Header: Handle, Verified Badge, Protocol */}
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
            {primaryProtocol}
          </span>
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
        <h3 className="text-sm font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">
          {agent.displayName}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-6">
          {agent.description || "Decentralized autonomous AI agent registered on AID protocol."}
        </p>
      </div>

      {/* Footer: View Passport & Copy Handle Buttons */}
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
          onClick={() => handleCopy(agent.primaryAddress, "handle")}
          className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5"
          title="Copy Handle"
        >
          {copiedHandle ? (
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
  );
}
