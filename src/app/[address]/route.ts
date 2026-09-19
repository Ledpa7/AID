import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";
import { formatTerminalCard } from "@/lib/terminal";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const rawAddress = decodeURIComponent(params.address || "").toLowerCase();

    // Only handle addresses that contain '@' (e.g. research@jidoo)
    if (!rawAddress.includes("@")) {
      return NextResponse.json({ error: "Invalid agent address" }, { status: 404 });
    }

    const resolution = await AIDStore.resolveAddress(rawAddress);

    if (!resolution) {
      return NextResponse.json(
        { error: `Agent address '${rawAddress}' not found` },
        { status: 404 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "";
    const accept = request.headers.get("accept") || "";

    const isTerminal =
      (userAgent.includes("curl") || userAgent.includes("HTTPie") || userAgent.includes("Wget")) &&
      !accept.includes("application/json") &&
      !accept.includes("text/html");

    if (isTerminal) {
      return new NextResponse(formatTerminalCard(resolution), {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // If browser, redirect to web console with pre-filled address
    if (accept.includes("text/html")) {
      const url = new URL("/", request.url);
      url.searchParams.set("resolve", rawAddress);
      return NextResponse.redirect(url);
    }

    // Default: return JSON
    return NextResponse.json(resolution);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
