import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";
import { verifyEd25519Signature, consumeChallenge } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, aid, publicKey, message, signature } = body;

    if (!message || !signature) {
      return NextResponse.json(
        { error: "Fields 'message' and 'signature' are required." },
        { status: 400 }
      );
    }

    let targetKey = publicKey;
    let resolvedAid = aid;
    let resolvedAddress = address;

    if (!targetKey) {
      if (address) {
        const resolution = await AIDStore.resolveAddress(address);
        if (!resolution) {
          return NextResponse.json(
            { error: `Agent with address '${address}' not found.` },
            { status: 404 }
          );
        }
        targetKey = resolution.publicKey;
        resolvedAid = resolution.aid;
        resolvedAddress = resolution.address;
      } else if (aid) {
        const agent = await AIDStore.findAgentByAID(aid);
        if (!agent) {
          return NextResponse.json(
            { error: `Agent with AID '${aid}' not found.` },
            { status: 404 }
          );
        }
        targetKey = agent.publicKey;
        resolvedAid = agent.id;
        resolvedAddress = agent.primaryAddress;
      }
    }

    if (!targetKey) {
      return NextResponse.json(
        {
          valid: false,
          error: "No registered public key found for this agent. Please provide 'publicKey'.",
        },
        { status: 400 }
      );
    }

    // Replay attack defense: If message is an AID challenge, enforce single-use consumption & subject match
    if (message.startsWith("AID-AUTH:")) {
      const challengeCheck = consumeChallenge(message, resolvedAddress || resolvedAid);
      if (!challengeCheck.valid) {
        return NextResponse.json(
          {
            valid: false,
            error: challengeCheck.error || "Invalid or replayed challenge nonce.",
          },
          { status: 401 }
        );
      }
    }

    const isValid = verifyEd25519Signature({
      publicKey: targetKey,
      message,
      signature,
    });


    if (!isValid) {
      return NextResponse.json(
        {
          valid: false,
          error: "Signature verification failed. Invalid cryptographic signature.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      aid: resolvedAid,
      address: resolvedAddress,
      keyType: "Ed25519",
      verifiedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to verify signature" },
      { status: 500 }
    );
  }
}
