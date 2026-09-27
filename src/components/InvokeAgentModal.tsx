"use client";

import { useState, useEffect } from "react";
import { X, Play, Loader2, CheckCircle2, AlertTriangle, AlertCircle, Copy, Check, Sparkles, Code2, Bot } from "lucide-react";
import { Agent } from "@/lib/types";

interface InvokeAgentModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

const AGENT_PRESETS: Record<string, { action: string; params: Record<string, any>; description: string }> = {
  "scout@github": {
    action: "trending_templates",
    params: { category: "ai-agents" },
    description: "Discover trending AI agent templates from GitHub",
  },
  "composer@cursor": {
    action: "refactor_code",
    params: { file: "App.tsx", prompt: "Convert state to use DuckDB and memoize" },
    description: "Multi-file AI refactoring and architecture analysis",
  },
  "search@perplexity": {
    action: "search",
    params: { query: "Latest breakthroughs in autonomous AI agent protocols", depth: "concise" },
    description: "Real-time web research with academic citations",
  },
  "swe@devin": {
    action: "plan_task",
    params: { task: "Implement zero-friction 401 handshake in Next.js middleware" },
    description: "Autonomous SWE planning and task decomposition",
  },
  "ui@v0": {
    action: "generate_ui",
    params: { prompt: "Responsive Tailwind SaaS leaderboard with dark mode" },
    description: "Generative UI component synthesis",
  },
  "cli@claude": {
    action: "execute_cli",
    params: { command: "git status && npm audit" },
    description: "Terminal-native repository automation",
  },
  "sentinel@cloudflare": {
    action: "check_threats",
    params: { zone: "edge-global", filter: "ddos_and_bot" },
    description: "Edge telemetry and zero-trust security audit",
  },
  "researcher@consensus": {
    action: "search_papers",
    params: { topic: "Cryptographic identity verification in multi-agent swarms" },
    description: "Academic research synthesis from 200M+ papers",
  },
  "stack@bolt": {
    action: "spin_sandbox",
    params: { template: "nextjs-supabase-duckdb" },
    description: "In-browser WebContainer sandbox provision",
  },
  "curator@spotify": {
    action: "generate_mix",
    params: { mood: "Deep Focus Coding", genre: "Synthwave / Lo-fi" },
    description: "Algorithmic audio and ambient session curator",
  },
};

export default function InvokeAgentModal({ agent, isOpen, onClose }: InvokeAgentModalProps) {
  const [action, setAction] = useState("ping");
  const [paramsInput, setParamsInput] = useState('{\n  "message": "hello"\n}');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Sync preset action and params when modal opens or agent changes
  useEffect(() => {
    if (!agent) return;
    const preset = AGENT_PRESETS[agent.primaryAddress];
    if (preset) {
      setAction(preset.action);
      setParamsInput(JSON.stringify(preset.params, null, 2));
    } else {
      setAction("ping");
      setParamsInput('{\n  "message": "hello from AID App Store"\n}');
    }
    setResponse(null);
    setError(null);
  }, [agent]);

  if (!isOpen || !agent) return null;

  const handleExecute = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    let parsedParams = {};
    try {
      if (paramsInput.trim()) {
        parsedParams = JSON.parse(paramsInput);
      }
    } catch (e: any) {
      setError(`Invalid JSON parameters: ${e.message}`);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/v1/invoke/${encodeURIComponent(agent.primaryAddress)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, params: parsedParams }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invocation failed");
      } else {
        setResponse(data);
      }
    } catch (e: any) {
      setError(e.message || "Failed to reach AID invocation gateway.");
    } finally {
      setIsLoading(false);
    }
  };

  const curlCommand = `curl -X POST https://aid.ledpa7.com/api/v1/invoke/${agent.primaryAddress} \\
  -H "Content-Type: application/json" \\
  -d '{"action": "${action}", "params": ${paramsInput.replace(/\n/g, "").replace(/\s+/g, " ")}}'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const presetInfo = AGENT_PRESETS[agent.primaryAddress];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                1-Click Agent Invocation
                <span className="text-xs font-mono font-normal text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                  {agent.primaryAddress}
                </span>
              </h2>
              <p className="text-xs text-slate-400">{agent.displayName || "Verified AI Agent"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 font-sans">
          {/* Preset Recommendation Pill */}
          {presetInfo && (
            <div className="p-2.5 bg-yellow-400/5 border border-yellow-400/20 rounded-xl text-xs text-yellow-300 flex items-center gap-2">
              <Bot className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>
                <strong>Recommended Test:</strong> {presetInfo.description}
              </span>
            </div>
          )}

          {/* Action Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Action
            </label>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. search_repos, refactor_code, search"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-yellow-400 transition"
            />
          </div>

          {/* JSON Params */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Parameters (JSON)
              </label>
              <button
                type="button"
                onClick={handleCopyCurl}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-yellow-400 transition"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCurl ? "Copied cURL" : "Copy cURL"}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={paramsInput}
              onChange={(e) => setParamsInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-yellow-400 transition"
            />
          </div>

          {/* Execute Button */}
          <button
            onClick={handleExecute}
            disabled={isLoading || !action.trim()}
            className="w-full py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-yellow-400/10 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Invoking Agent via AID Gateway...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Agent Now</span>
              </>
            )}
          </button>

          {/* Gateway Error Message */}
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Execution Response */}
          {response && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                {response.success ? (
                  response.isSimulation ? (
                    <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Sandbox Live Preview ({response.executionTimeMs}ms)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Executed Successfully ({response.executionTimeMs}ms)
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Target Endpoint Unreachable: {response.errorMessage || "Offline"}
                  </span>
                )}

                <span className="font-mono text-[11px] text-slate-500">
                  PoE Receipt: {response.receipt?.receiptId}
                </span>
              </div>

              <pre className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs font-mono text-slate-200 overflow-x-auto max-h-56 leading-relaxed">
                {JSON.stringify(response.result, null, 2)}
              </pre>

              {response.isSimulation && (
                <p className="text-[11px] text-slate-500 italic">
                  * Note: This showcase agent uses a live sandbox preview because the upstream vendor requires an enterprise API key.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
