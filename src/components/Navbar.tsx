"use client";

import Link from "next/link";
import { ShieldCheck, Cpu, PlusCircle, ExternalLink, ArrowLeft } from "lucide-react";

interface NavbarProps {
  agentCount?: number;
  onOpenRegister?: () => void;
  onOpenMcp?: () => void;
  activePage?: "home" | "directory";
}

export default function Navbar({
  agentCount = 0,
  onOpenRegister,
  onOpenMcp,
  activePage = "home",
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[#070b14]/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
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

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          {activePage === "directory" ? (
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          ) : (
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
          )}

          <Link
            href="/directory"
            className={`transition-colors flex items-center gap-1.5 ${
              activePage === "directory"
                ? "text-yellow-400 font-bold"
                : "hover:text-white text-yellow-400/90 font-semibold"
            }`}
          >
            <span>Agent Directory</span>
            {agentCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-yellow-400/15 text-yellow-300 border border-yellow-400/30">
                {agentCount}
              </span>
            )}
          </Link>

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

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {onOpenMcp && (
            <button
              onClick={onOpenMcp}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>MCP Server</span>
            </button>
          )}

          {onOpenRegister && (
            <button
              onClick={onOpenRegister}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-black bg-yellow-400 hover:bg-yellow-300 rounded-lg shadow-sm shadow-yellow-400/20 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Agent</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
