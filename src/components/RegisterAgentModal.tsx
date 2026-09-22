"use client";

import { useState } from "react";
import { Namespace } from "@/lib/types";
import { ShieldCheck, Users } from "lucide-react";

interface RegisterAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  namespaces: Namespace[];
  onSuccess: () => void;
}

export default function RegisterAgentModal({
  isOpen,
  onClose,
  namespaces,
  onSuccess,
}: RegisterAgentModalProps) {
  const [namespace, setNamespace] = useState(namespaces[0]?.slug || "");
  const [alias, setAlias] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [protocol, setProtocol] = useState<"a2a" | "mcp" | "rest">("rest");
  const [registeredBy, setRegisteredBy] = useState<"OWNER" | "COMMUNITY">("COMMUNITY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const selectedNs = namespace || (namespaces[0] && namespaces[0].slug);
      if (!selectedNs) {
        throw new Error("Please select or specify a namespace");
      }

      const res = await fetch("/api/v1/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace: selectedNs,
          alias,
          displayName,
          description,
          registeredBy,
          endpoints: [
            {
              url: endpoint,
              protocol,
              isPrimary: true,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to register agent");
      } else {
        setAlias("");
        setDisplayName("");
        setDescription("");
        setEndpoint("");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setFormError(err.message || "Error submitting form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-1">Register New AI Agent</h3>
        <p className="text-xs text-slate-400 mb-4">
          Issue a permanent cryptographic AID and verifiable address on the registry.
        </p>

        {formError && (
          <div className="mb-4 p-2.5 rounded bg-red-950/40 border border-red-800/50 text-xs text-red-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Registration Type Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              등록자 구분 (Who are you?)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRegisteredBy("COMMUNITY")}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  registeredBy === "COMMUNITY"
                    ? "bg-purple-950/40 border-purple-500/50 text-purple-200"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>추천 / 제보 등록</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  발견한 유용한 에이전트
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRegisteredBy("OWNER")}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  registeredBy === "OWNER"
                    ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>공식 소유자 등록</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  직접 만든 에이전트
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Namespace (@slug)
              </label>
              {namespaces.length > 0 ? (
                <select
                  value={namespace || namespaces[0]?.slug}
                  onChange={(e) => setNamespace(e.target.value)}
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
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Agent Alias</label>
              <input
                type="text"
                required
                placeholder="e.g. scout"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Display Name</label>
            <input
              type="text"
              required
              placeholder="e.g. GitHub Code Intelligence Agent"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Capabilities, scope, or LLM runtime..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Endpoint Target URL</label>
              <input
                type="url"
                required
                placeholder="https://api.domain.com/agent"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Protocol</label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value as any)}
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
              onClick={onClose}
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
  );
}
