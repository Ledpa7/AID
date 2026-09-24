import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/ratelimit";
import {
  issueAgentPassportToken,
  getAidRootPublicKey,
  verifyAgentPassportTokenOffline,
} from "@/lib/attestation";

/**
 * GET /api/v1/attest/passport
 * Returns the public key of the AID Root Authority for offline verification.
 */
export async function GET() {
  const rootPublicKey = getAidRootPublicKey();
  return NextResponse.json({
    aidRootPublicKey: rootPublicKey,
    version: "aid-vc-v1",
    description: "Use this Ed25519 public key to verify Agent Passport Tokens offline in 0ms without network calls.",
  });
}

/**
 * POST /api/v1/attest/passport
 * Issues an offline-verifiable Agent Passport Token (AVC) for a registered agent.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`attest-passport:${clientIp}`, { limit: 60, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return createRateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const { address, aid, ttlSeconds } = body;

    if (!address && !aid) {
      return NextResponse.json(
        { error: "Either 'address' or 'aid' is required to issue a passport token." },
        { status: 400 }
      );
    }

    const agent = address
      ? await AIDStore.resolveAddress(address)
      : await AIDStore.findAgentByAID(aid);

    if (!agent) {
      return NextResponse.json(
        { error: `Agent '${address || aid}' not found.` },
        { status: 404 }
      );
    }

    if (!agent.publicKey) {
      return NextResponse.json(
        { error: "Agent does not have a registered Ed25519 public key. Cannot issue passport token." },
        { status: 400 }
      );
    }

    // Determine trust level (0 - 4)
    const trustLevel = "trustLadder" in agent && agent.trustLadder ? agent.trustLadder.currentLevel : 1;
    const targetAid = "aid" in agent ? agent.aid : (agent as any).id;
    const targetAddress = "address" in agent ? agent.address : (agent as any).primaryAddress;
    const targetDisplayName = "displayName" in agent && agent.displayName ? agent.displayName : "Agent";
    const targetNamespace =
      "namespace" in agent
        ? typeof agent.namespace === "string"
          ? agent.namespace
          : agent.namespace.slug
        : (agent as any).namespaceSlug || "community";
    const targetDomainVerified =
      "verification" in agent
        ? !!agent.verification.domain
        : !!(agent as any).isDomainVerified;
    const capabilities = "capabilities" in agent && Array.isArray(agent.capabilities) ? agent.capabilities : [];

    const token = issueAgentPassportToken({
      aid: targetAid,
      address: targetAddress,
      displayName: targetDisplayName,
      publicKey: agent.publicKey,
      namespace: targetNamespace,
      isDomainVerified: targetDomainVerified,
      trustLevel,
      capabilities,
      ttlSeconds,
    });


    return NextResponse.json({
      success: true,
      token,
      verificationHint: "Tokens can be verified offline with AID Root Public Key via Ed25519.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to issue passport token." },
      { status: 500 }
    );
  }
}
