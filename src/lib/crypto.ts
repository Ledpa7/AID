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

interface StoredChallenge {
  subject: string;
  expiresAt: number;
}

// Global in-memory cache for ephemeral challenge nonces with 5-minute auto-expiry
const challengeCache = new Map<string, StoredChallenge>();

function pruneExpiredChallenges() {
  const now = Date.now();
  challengeCache.forEach((record, challenge) => {
    if (record.expiresAt < now) {
      challengeCache.delete(challenge);
    }
  });
}


/**
 * Generates an ephemeral challenge nonce for ownership verification and stores it in cache
 */
export function generateChallenge(subject: string): { challenge: string; expiresAt: number } {
  pruneExpiredChallenges();

  const nonce = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const expiresAt = timestamp + 1000 * 60 * 5; // 5 minutes validity
  const cleanSubject = subject.trim().toLowerCase();
  const challenge = `AID-AUTH:${cleanSubject}:${nonce}:${timestamp}`;

  challengeCache.set(challenge, {
    subject: cleanSubject,
    expiresAt,
  });

  return { challenge, expiresAt };
}

/**
 * Validates and consumes an ephemeral challenge nonce (single-use / replay-proof)
 */
export function consumeChallenge(
  challenge: string,
  expectedSubject?: string
): { valid: boolean; error?: string } {
  pruneExpiredChallenges();

  const stored = challengeCache.get(challenge);
  if (!stored) {
    return {
      valid: false,
      error: "Challenge nonce not found, expired, or already consumed (Replay Attack blocked).",
    };
  }

  const now = Date.now();
  if (stored.expiresAt < now) {
    challengeCache.delete(challenge);
    return {
      valid: false,
      error: "Challenge nonce has expired.",
    };
  }

  if (expectedSubject) {
    const cleanExpected = expectedSubject.trim().toLowerCase();
    if (stored.subject !== cleanExpected) {
      return {
        valid: false,
        error: `Challenge subject mismatch. Issued for '${stored.subject}', received for '${cleanExpected}'.`,
      };
    }
  }

  // Single-use: burn immediately upon successful consumption to block replay attacks
  challengeCache.delete(challenge);

  return { valid: true };
}


