import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";
import { auditAgentSecurity } from "@/lib/security";

export const runtime = "nodejs";

/**
 * POST /api/v1/agents/audit
 * Audits an agent's security profile, capabilities, and risk vectors.
 * Supports auditing existing registered agents (via address/aid)
 * or ad-hoc inspecting unverified agent tool manifests.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const address = (body.address || body.aid || "").trim();

    // 1. If an address or permanent AID is provided, audit the registered agent
    if (address) {
      const resolution = await AIDStore.resolveAddress(address);
      if (!resolution) {
        return NextResponse.json(
          { error: `Agent identifier '${address}' not found in registry.` },
          { status: 404 }
        );
      }

      const agent = await AIDStore.findAgentByAID(resolution.aid);
      const audit = auditAgentSecurity({
        primaryAddress: resolution.address,
        displayName: agent?.displayName || resolution.address,
        description: agent?.description,
        endpoints: resolution.endpoints,
        capabilities: resolution.capabilities,
        isDomainVerified: resolution.verification.domain,
      });

      return NextResponse.json({
        success: true,
        target: resolution.address,
        aid: resolution.aid,
        securityAudit: audit,
      });
    }

    // 2. Ad-hoc audit of candidate capabilities / tool schemas before execution
    const candidate = {
      displayName: body.displayName,
      description: body.description,
      endpointUrl: body.endpointUrl,
      endpoints: body.endpoints,
      capabilities: body.capabilities,
      isDomainVerified: body.isDomainVerified ?? false,
    };

    if (!candidate.displayName && !candidate.endpointUrl && !candidate.capabilities) {
      return NextResponse.json(
        { error: "Provide either 'address' or ad-hoc agent parameters ('displayName', 'endpointUrl', 'capabilities') to audit." },
        { status: 400 }
      );
    }

    const audit = auditAgentSecurity(candidate);
    return NextResponse.json({
      success: true,
      target: "ad-hoc-candidate",
      securityAudit: audit,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to perform security audit." },
      { status: 500 }
    );
  }
}
