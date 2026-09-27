import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";
import { ingestExecutionReceipt } from "@/lib/analytics";
import { hashPayload, getAidRootKeyPair } from "@/lib/attestation";
import { validateHostIsSafe } from "@/lib/ssrf";
import { ulid } from "ulid";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const startTime = Date.now();
  const rawAddress = decodeURIComponent(params.address || "").trim();

  try {
    const resolution = await AIDStore.resolveAddress(rawAddress);
    if (!resolution) {
      return NextResponse.json(
        { error: `Agent '${rawAddress}' not found in AID registry.` },
        { status: 404 }
      );
    }

    const agent = await AIDStore.findAgentByAID(resolution.aid);
    if (agent && agent.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Agent '${rawAddress}' is currently ${agent.status} (Slashing applied).` },
        { status: 403 }
      );
    }

    const targetUrl = resolution.primaryEndpoint?.url || resolution.endpoints?.[0]?.url;
    if (!targetUrl) {
      return NextResponse.json(
        { error: `Agent '${rawAddress}' has no active communication endpoint.` },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, params: agentParams = {} } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Missing required 'action' field in invocation payload." },
        { status: 400 }
      );
    }

    // SSRF Check for security (bypass internal mock routes like /api/agents/github)
    const isInternalMock = targetUrl.startsWith("/") || targetUrl.includes("/api/agents");
    if (!isInternalMock) {
      try {
        const parsed = new URL(targetUrl);
        const hostCheck = await validateHostIsSafe(parsed.hostname);
        if (!hostCheck.safe) {
          return NextResponse.json(
            { error: `Target endpoint failed SSRF security check: ${hostCheck.error}` },
            { status: 400 }
          );
        }
      } catch (err: any) {
        return NextResponse.json(
          { error: `Invalid endpoint URL: ${err.message}` },
          { status: 400 }
        );
      }
    }

    // Prepare dispatch URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aid-beryl.vercel.app";
    const absoluteTargetUrl = targetUrl.startsWith("/")
      ? `${baseUrl}${targetUrl}`
      : targetUrl;

    const callerAddress = request.headers.get("x-aid-caller") || "anonymous@community";

    // Forward invocation to target agent endpoint
    const response = await fetch(absoluteTargetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AID-Gateway": "v1",
        "X-AID-Caller": callerAddress,
      },
      body: JSON.stringify({ action, params: agentParams }),
    });

    const executionTimeMs = Date.now() - startTime;
    const responseData = await response.json().catch(() => ({}));
    const statusCode = response.ok ? "SUCCESS" : "FAILED";

    // Generate Gateway-attested Proof of Execution (PoE) Receipt
    const receiptId = `rcpt_${ulid()}`;
    const timestamp = Date.now();
    const inputHash = hashPayload({ action, params: agentParams });
    const outputHash = hashPayload(responseData);

    const messageToSign = [
      receiptId,
      callerAddress,
      resolution.address,
      resolution.aid,
      inputHash,
      outputHash,
      executionTimeMs.toString(),
      statusCode,
      timestamp.toString(),
    ].join("|");

    const rootKey = getAidRootKeyPair();
    const privKey = crypto.createPrivateKey(rootKey.privateKeyPem);
    const sigBuffer = crypto.sign(null, Buffer.from(messageToSign, "utf-8"), privKey);

    const receipt = {
      receiptId,
      requesterAddress: callerAddress,
      executorAddress: resolution.address,
      executorAid: resolution.aid,
      inputHash,
      outputHash,
      executionTimeMs,
      statusCode: statusCode as "SUCCESS" | "FAILED",
      errorMessage: response.ok ? undefined : `HTTP ${response.status}`,
      timestamp,
      executorSignature: sigBuffer.toString("hex"),
    };

    // Ingest into DuckDB analytical engine in background
    await ingestExecutionReceipt(receipt).catch((err) =>
      console.error("DuckDB PoE ingestion error:", err)
    );

    return NextResponse.json({
      success: response.ok,
      agent: {
        address: resolution.address,
        aid: resolution.aid,
        name: agent?.displayName || resolution.address,
      },
      action,
      executionTimeMs,
      result: responseData,
      receipt: {
        receiptId: receipt.receiptId,
        statusCode: receipt.statusCode,
        signature: receipt.executorSignature.slice(0, 16) + "...",
      },
    });
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    return NextResponse.json(
      {
        error: error.message || "Universal A2A gateway execution failed",
        executionTimeMs,
      },
      { status: 500 }
    );
  }
}
