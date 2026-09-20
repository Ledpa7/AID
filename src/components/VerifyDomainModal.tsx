"use client";

import { useState, useEffect } from "react";
import { Globe, RefreshCw, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { Namespace } from "@/lib/types";

interface VerifyDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  namespace: Namespace | null;
  onSuccess: () => void;
}

export default function VerifyDomainModal({
  isOpen,
  onClose,
  namespace,
  onSuccess,
}: VerifyDomainModalProps) {
  const [challenge, setChallenge] = useState<any>(null);
  const [isFetchingChallenge, setIsFetchingChallenge] = useState(false);
  const [isCheckingDns, setIsCheckingDns] = useState(false);
  const [dnsCopied, setDnsCopied] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");

  useEffect(() => {
    if (isOpen && namespace) {
      fetchChallenge();
    } else {
      setChallenge(null);
      setVerifyError("");
      setVerifySuccess("");
    }
  }, [isOpen, namespace]);

  const fetchChallenge = async () => {
    if (!namespace) return;
    setIsFetchingChallenge(true);
    setVerifyError("");
    setVerifySuccess("");
    try {
      const res = await fetch(`/api/v1/namespaces/${namespace.slug}/verify`);
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Failed to load verification challenge");
      } else {
        setChallenge(data);
      }
    } catch (err: any) {
      setVerifyError(err.message || "Network error");
    } finally {
      setIsFetchingChallenge(false);
    }
  };

  const handleExecuteDnsCheck = async () => {
    if (!namespace) return;
    setIsCheckingDns(true);
    setVerifyError("");
    setVerifySuccess("");
    try {
      const res = await fetch(`/api/v1/namespaces/${namespace.slug}/verify`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "DNS challenge token not found in TXT records");
      } else {
        setVerifySuccess(`✓ Successfully verified ownership of @${namespace.slug} via DNS!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setVerifyError(err.message || "Failed to verify DNS");
    } finally {
      setIsCheckingDns(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setDnsCopied(type);
    setTimeout(() => setDnsCopied(null), 2000);
  };

  if (!isOpen || !namespace) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Domain DNS Verification</h3>
              <p className="text-xs text-slate-400 font-mono">
                @{namespace.slug} • {namespace.domain || "No domain set"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs p-1">
            ✕
          </button>
        </div>

        {isFetchingChallenge ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-yellow-400" />
            <span>Loading DNS verification challenge...</span>
          </div>
        ) : challenge ? (
          <div className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Add the following DNS <span className="text-yellow-400 font-bold font-mono">TXT</span>{" "}
              record at your domain provider (Cloudflare, Route53, GoDaddy, etc.) to prove ownership:
            </p>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Record Type:</span>
                <span className="text-slate-200 font-bold bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                  TXT
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500 text-[11px]">Host / Name:</span>
                  <button
                    onClick={() => handleCopy(challenge.instructions.name, "name")}
                    className="text-yellow-400 hover:text-yellow-300 text-[10px] flex items-center gap-1"
                  >
                    {dnsCopied === "name" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {dnsCopied === "name" ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="bg-slate-950 p-2 rounded text-slate-300 select-all border border-slate-800/80">
                  {challenge.instructions.name}{" "}
                  <span className="text-slate-500 text-[10px]">({challenge.instructions.host})</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500 text-[11px]">TXT Value:</span>
                  <button
                    onClick={() => handleCopy(challenge.instructions.value, "value")}
                    className="text-yellow-400 hover:text-yellow-300 text-[10px] flex items-center gap-1"
                  >
                    {dnsCopied === "value" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {dnsCopied === "value" ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="bg-slate-950 p-2 rounded text-emerald-400 select-all border border-slate-800/80 break-all text-[11px]">
                  {challenge.instructions.value}
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
                <span>{verifyError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteDnsCheck}
                disabled={isCheckingDns}
                className="px-4 py-2 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-400/20"
              >
                {isCheckingDns ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking Google & Cloudflare DNS...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Execute DNS Check</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-red-400">
            {verifyError || "Unable to load verification instructions."}
          </div>
        )}
      </div>
    </div>
  );
}
