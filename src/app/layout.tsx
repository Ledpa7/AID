import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AID - AI Agent Identity Infrastructure",
  description: "Identity, DNS, Registry, and Trust Infrastructure for Autonomous AI Agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen bg-[#070b14] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-300">
        {children}
      </body>
    </html>
  );
}
