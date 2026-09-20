import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AIDStore } from "@/lib/store";
import PassportView from "@/components/PassportView";
import { ShieldAlert, ArrowLeft, Search } from "lucide-react";

interface PageProps {
  params: {
    address: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const rawAddress = decodeURIComponent(params.address || "").toLowerCase().trim();
  const resolution = await AIDStore.resolveAddress(rawAddress);

  if (!resolution) {
    return {
      title: `Agent Not Found — AID Protocol`,
      description: `The requested agent address '${rawAddress}' was not found in the AID registry.`,
    };
  }

  const agent = await AIDStore.findAgentByAID(resolution.aid);
  const title = `${agent?.displayName || resolution.address} (@${resolution.address}) — AID Official Passport`;
  const description =
    agent?.description ||
    `Verified AI Agent Identity for ${resolution.address}. Cryptographic Ed25519 key, domain trust evidence, and communication endpoints.`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aid-beryl.vercel.app";
  const pageUrl = `${baseUrl}/${encodeURIComponent(resolution.address)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "AID Protocol — AI Agent Identity & Trust Infrastructure",
      images: [
        {
          url: `${baseUrl}/api/v1/badge/${encodeURIComponent(resolution.address)}`,
          width: 800,
          height: 400,
          alt: `${resolution.address} Passport Badge`,
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PassportPage({ params }: PageProps) {
  const rawAddress = decodeURIComponent(params.address || "").toLowerCase().trim();
  const resolution = await AIDStore.resolveAddress(rawAddress);

  if (!resolution) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-950/50 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">에이전트 여권을 찾을 수 없습니다</h1>
            <p className="text-xs font-mono text-slate-400">
              Address: <span className="text-red-400 font-semibold">{rawAddress}</span>
            </p>
            <p className="text-sm text-slate-400 pt-2">
              입력하신 주소의 에이전트가 아직 AID 레지스트리에 등록되지 않았거나 일시 중단된 상태입니다.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition w-full sm:w-auto justify-center shadow-lg shadow-indigo-600/20"
            >
              <Search className="w-4 h-4" />
              <span>레지스트리 검색</span>
            </Link>
            <Link
              href="/#register"
              className="inline-flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl transition border border-slate-700 w-full sm:w-auto justify-center"
            >
              <span>에이전트 신규 등록</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const agent = await AIDStore.findAgentByAID(resolution.aid);
  if (!agent) {
    notFound();
  }

  const domainUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aid-beryl.vercel.app";

  return <PassportView agent={agent} resolution={resolution} domainUrl={domainUrl} />;
}
