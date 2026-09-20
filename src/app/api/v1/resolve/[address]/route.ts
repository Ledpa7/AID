import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";

import { formatTerminalCard } from "@/lib/terminal";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const rawAddress = decodeURIComponent(params.address).trim();
    const isAid = rawAddress.toLowerCase().startsWith("aid_");
    if (!rawAddress.includes("@") && !isAid) {
      return NextResponse.json(
        { error: "Invalid address format. Expected alias@namespace (e.g. scout@github) or AID (e.g. aid_01M30...)" },
        { status: 400 }
      );
    }

    const resolution = await AIDStore.resolveAddress(rawAddress);

    if (!resolution) {
      return NextResponse.json(
        { error: `Agent identifier '${rawAddress}' not found or suspended` },
        { status: 404 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "";
    const accept = request.headers.get("accept") || "";
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format");

    const isCurl =
      format === "terminal" ||
      format === "text" ||
      ((userAgent.includes("curl") || userAgent.includes("HTTPie") || userAgent.includes("Wget")) &&
        !accept.includes("application/json"));

    if (isCurl) {
      return new NextResponse(formatTerminalCard(resolution), {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      });
    }

    return NextResponse.json(resolution, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
