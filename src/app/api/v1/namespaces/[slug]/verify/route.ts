import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/ratelimit";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = decodeURIComponent(params.slug || "").replace(/^@/, "").toLowerCase();
    const challenge = await AIDStore.getDomainChallenge(slug);

    return NextResponse.json({
      namespace: `@${challenge.slug}`,
      domain: challenge.domain,
      isVerified: challenge.isVerified,
      verifiedAt: challenge.verifiedAt,
      instructions: {
        recordType: challenge.dnsRecord.type,
        host: challenge.dnsRecord.host,
        name: challenge.dnsRecord.name,
        value: challenge.dnsRecord.value,
        note: `Add a TXT record for '${challenge.dnsRecord.name}' with value '${challenge.dnsRecord.value}' in your DNS provider (e.g., Cloudflare, Route53, GoDaddy).`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve domain verification challenge" },
      { status: 400 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`verify-dns:${clientIp}`, { limit: 20, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return createRateLimitResponse(rateCheck);
    }

    const slug = decodeURIComponent(params.slug || "").replace(/^@/, "").toLowerCase();
    const result = await AIDStore.verifyDomain(slug);

    if (!result.success) {
      return NextResponse.json(
        {
          verified: false,
          error: result.error,
          domain: result.domain,
          queriedHosts: result.queriedHosts,
          recordsFound: result.recordsFound,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      verified: true,
      domain: result.domain,
      matchedRecord: result.matchedRecord,
      verifiedAt: result.verifiedAt,
      message: result.message || "Domain ownership successfully verified via DNS TXT record!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Domain verification failed" },
      { status: 400 }
    );
  }
}
