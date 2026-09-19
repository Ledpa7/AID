import crypto from "crypto";

export interface VerifySignatureParams {
  publicKey: string; // Raw hex, base64, or ed25519:hex
  message: string;
  signature: string; // Hex or base64
}

export function parseRawPublicKey(keyStr: string): Buffer {
  let cleaned = keyStr.trim();
  if (cleaned.startsWith("ed25519:")) {
    cleaned = cleaned.slice("ed25519:".length);
  }

  // Detect hex vs base64
  if (/^[0-9a-fA-F]{64}$/.test(cleaned)) {
    return Buffer.from(cleaned, "hex");
  }

  const b64Buf = Buffer.from(cleaned, "base64");
  if (b64Buf.length === 32) {
    return b64Buf;
  }

  // If 44 bytes SPKI DER, slice last 32 bytes
  if (b64Buf.length === 44) {
    return b64Buf.slice(-32);
  }

  throw new Error("Invalid Ed25519 public key format. Expected 32-byte hex or base64.");
}

export function parseSignature(sigStr: string): Buffer {
  const cleaned = sigStr.trim();
  if (/^[0-9a-fA-F]{128}$/.test(cleaned)) {
    return Buffer.from(cleaned, "hex");
  }
  const b64Buf = Buffer.from(cleaned, "base64");
  if (b64Buf.length === 64) {
    return b64Buf;
  }
  throw new Error("Invalid Ed25519 signature format. Expected 64-byte hex or base64.");
}

/**
 * Verifies Ed25519 signature natively without external libraries
 */
export function verifyEd25519Signature({
  publicKey,
  message,
  signature,
}: VerifySignatureParams): boolean {
  try {
    const rawPub = parseRawPublicKey(publicKey);
    const sigBuf = parseSignature(signature);
    const msgBuf = Buffer.from(message, "utf-8");

    const pubJwk = crypto.createPublicKey({
      key: {
        kty: "OKP",
        crv: "Ed25519",
        x: rawPub.toString("base64url"),
      },
      format: "jwk",
    });

    return crypto.verify(null, msgBuf, pubJwk, sigBuf);
  } catch (err) {
    return false;
  }
}

/**
 * Generates an ephemeral challenge nonce for ownership verification
 */
export function generateChallenge(subject: string): { challenge: string; expiresAt: number } {
  const nonce = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const expiresAt = timestamp + 1000 * 60 * 5; // 5 minutes validity
  const challenge = `AID-AUTH:${subject}:${nonce}:${timestamp}`;
  return { challenge, expiresAt };
}
