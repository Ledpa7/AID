import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/ratelimit";
import { validateEndpointLiveness } from "@/lib/ssrf";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10", 10) || 10, 1), 50);
    const cursor = searchParams.get("cursor") || undefined;
    const query = searchParams.get("q") || undefined;
    const namespace = searchParams.get("namespace") || undefined;
    const category = searchParams.get("category") || undefined;
    const protocol = searchParams.get("protocol") || undefined;
    const minTrustStr = searchParams.get("min_trust") || searchParams.get("minTrustLevel");
    const minTrustLevel = minTrustStr !== null && minTrustStr !== undefined ? parseInt(minTrustStr, 10) : undefined;

    const result = await AIDStore.getAgents({
      limit,
      cursor,
      query,
      namespace,
      category,
      protocol,
      minTrustLevel: isNaN(minTrustLevel as any) ? undefined : minTrustLevel,
    });

    return NextResponse.json({
      total: result.total,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
      limit: result.limit,
      agents: result.agents,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`register:${clientIp}`, { limit: 15, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return createRateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const { namespace, alias, displayName, description, endpointUrl, protocol, publicKey, cardSnapshot, registeredBy, endpoints } = body;

    const targetUrl = endpointUrl || (Array.isArray(endpoints) && endpoints[0]?.url);
    const targetProtocol = protocol || (Array.isArray(endpoints) && endpoints[0]?.protocol) || "a2a";

    if (!namespace || !alias || !displayName || !targetUrl) {
      return NextResponse.json(
        { error: "Missing required fields: namespace, alias, displayName, endpointUrl" },
        { status: 400 }
      );
    }

    // ⚡ Real-Time Liveness & Anti-Spam Gatekeeper Check
    const liveness = await validateEndpointLiveness(targetUrl);
    if (!liveness.alive) {
      return NextResponse.json(
        {
          error: `[Liveness Probe Failed] 에이전트 엔드포인트 서버가 응답하지 않습니다: ${liveness.error}`,
          liveness,
        },
        { status: 400 }
      );
    }

    const newAgent = await AIDStore.registerAgent({
      namespaceSlug: namespace,
      alias,
      displayName,
      description,
      endpointUrl: targetUrl,
      protocol: targetProtocol,
      publicKey,
      cardSnapshot,
      registeredBy: registeredBy === "COMMUNITY" ? "COMMUNITY" : "OWNER",
    });

    return NextResponse.json({ ...newAgent, initialLiveness: liveness }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
