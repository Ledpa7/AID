import crypto from "crypto";
import {
  AgentPassportToken,
  AgentPassportTokenPayload,
  ExecutionReceipt,
  CreateReceiptParams,
  VerifyReceiptParams,
} from "./types";
import { verifyEd25519Signature } from "./crypto";
import { ulid } from "ulid";

// Deterministic AID Root Authority Key for Development & Testing
// In production, loaded via process.env.AID_ROOT_PRIVATE_KEY_PEM
const DEV_ROOT_SEED = Buffer.from("AID_ROOT_AUTHORITY_DEVELOPMENT_MASTER_SEED_2026_ED25519_KEY").slice(0, 32);

let cachedRootKeyPair: { publicKey: string; privateKeyPem: string } | null = null;

export function getAidRootKeyPair(): { publicKey: string; privateKeyPem: string } {
  if (cachedRootKeyPair) return cachedRootKeyPair;

  if (process.env.AID_ROOT_PRIVATE_KEY_PEM && process.env.AID_ROOT_PUBLIC_KEY) {
    cachedRootKeyPair = {
      publicKey: process.env.AID_ROOT_PUBLIC_KEY,
      privateKeyPem: process.env.AID_ROOT_PRIVATE_KEY_PEM,
    };
    return cachedRootKeyPair;
  }

  // Derive Ed25519 keypair from 32-byte seed
  // SPKI DER header for Ed25519 is 12 bytes: 302a300506032b6570032100
  // PKCS#8 DER header for Ed25519 is 16 bytes: 302e020100300506032b657004220420
  const pkcs8Der = Buffer.concat([
    Buffer.from("302e020100300506032b657004220420", "hex"),
    DEV_ROOT_SEED,
  ]);
  const privateKey = crypto.createPrivateKey({ key: pkcs8Der, format: "der", type: "pkcs8" });
  const publicKey = crypto.createPublicKey(privateKey);
  const spkiDer = publicKey.export({ type: "spki", format: "der" });
  const rawPubHex = spkiDer.slice(-32).toString("hex");

  cachedRootKeyPair = {
    publicKey: `ed25519:${rawPubHex}`,
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };

  return cachedRootKeyPair;
}

export function getAidRootPublicKey(): string {
  return getAidRootKeyPair().publicKey;
}

/**
 * Deterministically sorts object keys for canonical JSON serialization
 */
export function canonicalJson(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => canonicalJson(item)).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(obj[key])}`);
  return "{" + pairs.join(",") + "}";
}

/**
 * Computes SHA-256 hash of any input or output payload
 */
export function hashPayload(payload: any): string {
  const canonical = canonicalJson(payload);
  return `sha256:${crypto.createHash("sha256").update(canonical, "utf-8").digest("hex")}`;
}

/**
 * Issues a self-contained, offline-verifiable Agent Passport Token (AVC)
 * signed by the AID Root Authority.
 */
export function issueAgentPassportToken(
  params: {
    aid: string;
    address: string;
    displayName: string;
    publicKey: string;
    namespace: string;
    isDomainVerified: boolean;
    trustLevel: number;
    capabilities?: string[];
    ttlSeconds?: number;
  }
): AgentPassportToken {
  const now = Math.floor(Date.now() / 1000);
  const ttl = params.ttlSeconds || 60 * 60 * 24 * 7; // 7 days default

  const payload: AgentPassportTokenPayload = {
    aid: params.aid,
    address: params.address,
    displayName: params.displayName,
    publicKey: params.publicKey,
    namespace: params.namespace,
    isDomainVerified: params.isDomainVerified,
    trustLevel: params.trustLevel,
    capabilities: params.capabilities || [],
    issuedAt: now,
    expiresAt: now + ttl,
  };

  const canonicalPayloadStr = canonicalJson(payload);
  const rootKey = getAidRootKeyPair();
  const privKey = crypto.createPrivateKey(rootKey.privateKeyPem);
  const sigBuffer = crypto.sign(null, Buffer.from(canonicalPayloadStr, "utf-8"), privKey);

  return {
    version: "aid-vc-v1",
    payload,
    rootSignature: sigBuffer.toString("hex"),
  };
}

/**
 * Verifies an Agent Passport Token completely offline in 0ms (no HTTP roundtrip).
 */
export function verifyAgentPassportTokenOffline(
  token: AgentPassportToken,
  expectedRootPublicKey?: string
): { valid: boolean; error?: string; payload?: AgentPassportTokenPayload } {
  try {
    if (!token || token.version !== "aid-vc-v1" || !token.payload || !token.rootSignature) {
      return { valid: false, error: "Malformed agent passport token structure." };
    }

    const now = Math.floor(Date.now() / 1000);
    if (token.payload.expiresAt && token.payload.expiresAt < now) {
      return { valid: false, error: "Agent passport token has expired." };
    }

    const rootPub = expectedRootPublicKey || getAidRootPublicKey();
    const canonicalPayloadStr = canonicalJson(token.payload);

    const isValid = verifyEd25519Signature({
      publicKey: rootPub,
      message: canonicalPayloadStr,
      signature: token.rootSignature,
    });

    if (!isValid) {
      return { valid: false, error: "Invalid AID Root Authority cryptographic signature." };
    }

    return { valid: true, payload: token.payload };
  } catch (err: any) {
    return { valid: false, error: err.message || "Failed to verify passport token offline." };
  }
}

/**
 * Creates a tamper-evident Proof of Execution (PoE) Receipt.
 * Signed by the executor agent using its local Ed25519 private key.
 */
export function createExecutionReceipt(params: CreateReceiptParams): ExecutionReceipt {
  const receiptId = `rcpt_${ulid()}`;
  const timestamp = Date.now();
  const inputHash = hashPayload(params.inputPayload);
  const outputHash = hashPayload(params.outputPayload);
  const statusCode = params.statusCode || "SUCCESS";

  const messageToSign = [
    receiptId,
    params.requesterAddress,
    params.executorAddress,
    params.executorAid,
    inputHash,
    outputHash,
    params.executionTimeMs.toString(),
    statusCode,
    timestamp.toString(),
  ].join("|");

  const privKey = crypto.createPrivateKey(params.privateKeyPem);
  const sigBuffer = crypto.sign(null, Buffer.from(messageToSign, "utf-8"), privKey);

  return {
    receiptId,
    requesterAddress: params.requesterAddress,
    executorAddress: params.executorAddress,
    executorAid: params.executorAid,
    inputHash,
    outputHash,
    executionTimeMs: params.executionTimeMs,
    statusCode,
    errorMessage: params.errorMessage,
    timestamp,
    executorSignature: sigBuffer.toString("hex"),
  };
}

/**
 * Verifies an Execution Receipt: checks input/output hashes and cryptographic signature.
 */
export function verifyExecutionReceipt(params: VerifyReceiptParams): {
  valid: boolean;
  error?: string;
  receiptId?: string;
} {
  try {
    const { receipt, inputPayload, outputPayload, executorPublicKey } = params;

    if (!receipt || !receipt.receiptId || !receipt.executorSignature) {
      return { valid: false, error: "Missing required receipt fields." };
    }

    // Verify input hash if input payload provided
    if (inputPayload !== undefined) {
      const computedInputHash = hashPayload(inputPayload);
      if (computedInputHash !== receipt.inputHash) {
        return {
          valid: false,
          error: `Input hash mismatch. Expected ${receipt.inputHash}, computed ${computedInputHash}`,
        };
      }
    }

    // Verify output hash if output payload provided
    if (outputPayload !== undefined) {
      const computedOutputHash = hashPayload(outputPayload);
      if (computedOutputHash !== receipt.outputHash) {
        return {
          valid: false,
          error: `Output hash mismatch. Expected ${receipt.outputHash}, computed ${computedOutputHash}`,
        };
      }
    }

    // Verify cryptographic signature if public key provided
    if (executorPublicKey) {
      const reconstructedMessage = [
        receipt.receiptId,
        receipt.requesterAddress,
        receipt.executorAddress,
        receipt.executorAid,
        receipt.inputHash,
        receipt.outputHash,
        receipt.executionTimeMs.toString(),
        receipt.statusCode,
        receipt.timestamp.toString(),
      ].join("|");

      const isSigValid = verifyEd25519Signature({
        publicKey: executorPublicKey,
        message: reconstructedMessage,
        signature: receipt.executorSignature,
      });

      if (!isSigValid) {
        return { valid: false, error: "Cryptographic signature verification failed on receipt." };
      }
    }

    return { valid: true, receiptId: receipt.receiptId };
  } catch (err: any) {
    return { valid: false, error: err.message || "Failed to verify execution receipt." };
  }
}
