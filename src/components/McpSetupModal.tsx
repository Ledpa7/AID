"use client";

import { useState } from "react";
import { Cpu, Copy, Check } from "lucide-react";

interface McpSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function McpSetupModal({ isOpen, onClose }: McpSetupModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const registryUrl =
    typeof window !== "undefined" ? window.location.origin : "https://aid-beryl.vercel.app";

  const configJson = JSON.stringify(
    {
      mcpServers: {
        aid: {
          command: "npx",
          args: ["-y", "aid-mcp", "--registry", registryUrl],
        },
      },
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(configJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Connect via Model Context Protocol</h3>
          </div>
          <button
            onClick={onClose}
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
              {configJson}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-[10px] font-medium border border-slate-700 flex items-center gap-1.5 transition"
            >
              {copied ? (
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
              <span className="text-slate-500 text-[11px]">Address/AID → Endpoint, Verification Evidence</span>
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
            onClick={onClose}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-xs rounded-lg shadow-sm shadow-yellow-400/20 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
