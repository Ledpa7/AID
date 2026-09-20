"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface FooterProps {
  onOpenMcp?: () => void;
}

export default function Footer({ onOpenMcp }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-slate-800/80 py-8 bg-[#05080f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <span>AID • Agent Identity Directory & Trust Infrastructure</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-slate-300 transition">
            Home
          </Link>
          <Link href="/directory" className="hover:text-slate-300 transition">
            Directory
          </Link>
          <a
            href="https://github.com/Ledpa7/AID"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-300 transition"
          >
            GitHub Repo
          </a>
          {onOpenMcp && (
            <button onClick={onOpenMcp} className="hover:text-slate-300 transition">
              MCP Setup
            </button>
          )}
          <span>MIT License</span>
        </div>
      </div>
    </footer>
  );
}
