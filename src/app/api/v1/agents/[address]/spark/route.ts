import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/ratelimit";
import crypto from "crypto";

export const runtime = "nodejs";

function getClientFingerprint(req: NextRequest): string {
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") || "unknown-ua";
  const customId = req.headers.get("x-client-id") || "";
  return crypto.createHash("sha256").update(`${ip}:${ua}:${customId}`).digest("hex").slice(0, 16);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = decodeURIComponent(params.address);
    const fingerprint = getClientFingerprint(req);
    const sparksCount = AIDStore.getSparksCount(address);
    const hasSparked = AIDStore.hasClientSparked(address, fingerprint);

    return NextResponse.json({
      address,
      sparksCount,
      hasSparked,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = decodeURIComponent(params.address);
    const clientIp = getClientIp(req);

    // Rate Limit: 40 spark actions per minute per IP
    const rateCheck = checkRateLimit(`spark:${clientIp}`, { limit: 40, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return createRateLimitResponse(rateCheck);
    }

    const fingerprint = getClientFingerprint(req);
    const result = await AIDStore.toggleSpark(address, fingerprint);

    return NextResponse.json({
      success: true,
      address,
      sparked: result.sparked,
      sparksCount: result.sparksCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to toggle spark" },
      { status: 400 }
    );
  }
}
