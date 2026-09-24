import { NextRequest, NextResponse } from "next/server";
import { safeFetchAgentCard } from "@/lib/ssrf";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`inspect:${clientIp}`, { limit: 30, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return createRateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Field 'url' is required." },
        { status: 400 }
      );
    }


    const result = await safeFetchAgentCard(url);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Failed to inspect Agent Card" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      card: result.data,
      sha256: result.hash,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process inspect request" },
      { status: 500 }
    );
  }
}
