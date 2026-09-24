import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/ratelimit";
import { verifyExecutionReceipt } from "@/lib/attestation";
import {
  ingestExecutionReceipt,
  getAgentReputationMetrics,
  getNetworkAttestationStats,
} from "@/lib/analytics";
import { ExecutionReceipt } from "@/lib/types";

/**
 * GET /api/v1/attest/receipts?address=scout@github
 * Returns DuckDB-computed dynamic reputation metrics for an agent or network summary.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (address) {
      const metrics = await getAgentReputationMetrics(address.trim());
      return NextResponse.json({ success: true, metrics });
    }

    const networkStats = await getNetworkAttestationStats();
    return NextResponse.json({ success: true, networkStats });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to query attestation analytics." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/attest/receipts
 * Ingests and verifies an Ed25519-signed Execution Receipt (PoE).
 * Updates the agent's DuckDB dynamic reputation score.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`attest-receipts:${clientIp}`, { limit: 120, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return createRateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const { receipt, inputPayload, outputPayload } = body;

    if (!receipt || !receipt.receiptId || !receipt.executorAddress || !receipt.executorSignature) {
      return NextResponse.json(
        { error: "Invalid receipt payload. Missing receiptId, executorAddress, or executorSignature." },
        { status: 400 }
      );
    }

    // Resolve executor public key
    const executorAgent = await AIDStore.resolveAddress(receipt.executorAddress);
    if (!executorAgent || !executorAgent.publicKey) {
      return NextResponse.json(
        { error: `Executor agent '${receipt.executorAddress}' has no registered public key.` },
        { status: 400 }
      );
    }

    // Verify receipt signature and payload hashes
    const verifyResult = verifyExecutionReceipt({
      receipt: receipt as ExecutionReceipt,
      inputPayload,
      outputPayload,
      executorPublicKey: executorAgent.publicKey,
    });

    if (!verifyResult.valid) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: verifyResult.error || "Execution receipt cryptographic verification failed.",
        },
        { status: 401 }
      );
    }

    // Ingest into DuckDB
    await ingestExecutionReceipt(receipt as ExecutionReceipt);

    // Fetch updated real-time reputation
    const updatedMetrics = await getAgentReputationMetrics(receipt.executorAddress);

    return NextResponse.json({
      success: true,
      verified: true,
      receiptId: receipt.receiptId,
      executorAddress: receipt.executorAddress,
      reputation: updatedMetrics,
      recordedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process execution receipt." },
      { status: 500 }
    );
  }
}
