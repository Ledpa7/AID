import crypto from "crypto";
import {
  issueAgentPassportToken,
  verifyAgentPassportTokenOffline,
  createExecutionReceipt,
  verifyExecutionReceipt,
  getAidRootPublicKey,
} from "../lib/attestation";
import {
  AgentPassportToken,
  ExecutionReceipt,
  CreateReceiptParams,
  VerifyReceiptParams,
} from "../lib/types";

export interface KeyPairResult {
  publicKey: string; // "ed25519:<hex>"
  privateKeyPem: string;
}

export interface AutoEnrollOptions {
  token: string;
  alias: string;
  displayName: string;
  endpointUrl: string;
  protocol?: "a2a" | "mcp" | "rest";
  autoGenerateKeys?: boolean;
  publicKey?: string;
  privateKeyPem?: string;
  description?: string;
  category?: "Coding" | "Research" | "Design" | "DevOps" | "Media" | "General";
  registryUrl?: string;
}

export interface EnrolledAgentSession {
  aid: string;
  address: string;
  displayName: string;
  namespace: string;
  endpoint: {
    protocol: "a2a" | "mcp" | "rest";
    url: string;
  };
  publicKey?: string;
  privateKeyPem?: string;
  isDomainVerified: boolean;
  isKeyVerified: boolean;
  tokenUsed: {
    name: string;
    remainingQuota: number;
  };
  enrolledAt: string;
  sign: (message: string) => string;
}

export interface ResolveOptions {
  registryUrl?: string;
}

export interface VerifySignatureOptions {
  address: string;
  message: string;
  signature: string;
  registryUrl?: string;
}

const DEFAULT_REGISTRY_URL =
  typeof process !== "undefined" && process.env?.AID_REGISTRY_URL
    ? process.env.AID_REGISTRY_URL.replace(/\/$/, "")
    : "https://aid-beryl.vercel.app";

export class AID {
  /**
   * Generates a native Ed25519 keypair in memory.
   * Private key never leaves the runtime environment.
   */
  static generateKeyPair(): KeyPairResult {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
    const spkiDer = publicKey.export({ type: "spki", format: "der" });
    const rawPub = spkiDer.slice(-32).toString("hex");
    const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

    return {
      publicKey: `ed25519:${rawPub}`,
      privateKeyPem,
    };
  }

  /**
   * Cryptographically signs a message payload using the agent's Ed25519 private key.
   * Returns a 64-byte hex signature.
   */
  static signPayload(params: { message: string; privateKeyPem: string }): string {
    const privKey = crypto.createPrivateKey(params.privateKeyPem);
    const msgBuf = Buffer.from(params.message, "utf-8");
    const signature = crypto.sign(null, msgBuf, privKey);
    return signature.toString("hex");
  }

  /**
   * Autonomously enrolls an agent into the AID network using an authorized Enrollment Token.
   * Handles local key generation and public key registration automatically.
   */
  static async autoEnroll(options: AutoEnrollOptions): Promise<EnrolledAgentSession> {
    const registryUrl = (options.registryUrl || DEFAULT_REGISTRY_URL).replace(/\/$/, "");
    let pubKey = options.publicKey;
    let privKeyPem = options.privateKeyPem;

    // Automatically generate native Ed25519 keypair if requested
    if (options.autoGenerateKeys !== false && !pubKey) {
      const generated = this.generateKeyPair();
      pubKey = generated.publicKey;
      privKeyPem = generated.privateKeyPem;
    }

    const payload = {
      token: options.token.trim(),
      alias: options.alias.trim(),
      displayName: options.displayName.trim(),
      endpointUrl: options.endpointUrl.trim(),
      protocol: options.protocol || "a2a",
      publicKey: pubKey,
      description: options.description?.trim(),
      category: options.category,
    };

    const res = await fetch(`${registryUrl}/api/v1/enrollments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.token.trim()}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `AID enrollment failed with HTTP ${res.status}`);
    }

    const data = await res.json();

    return {
      ...data,
      privateKeyPem: privKeyPem,
      sign: (message: string) => {
        if (!privKeyPem) {
          throw new Error("Cannot sign message: Private key is not available in this session.");
        }
        return AID.signPayload({ message, privateKeyPem: privKeyPem });
      },
    };
  }

  /**
   * Resolves an agent handle or permanent AID against the global AID registry.
   */
  static async resolve(address: string, options?: ResolveOptions) {
    const registryUrl = (options?.registryUrl || DEFAULT_REGISTRY_URL).replace(/\/$/, "");
    const cleanAddress = encodeURIComponent(address.trim());
    const res = await fetch(`${registryUrl}/api/v1/resolve/${cleanAddress}`, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Agent resolution failed with HTTP ${res.status}`);
    }

    return await res.json();
  }

  /**
   * Verifies an Ed25519 signature of a remote agent via the AID Trust Layer.
   */
  static async verifySignature(options: VerifySignatureOptions): Promise<{ verified: boolean; aid: string }> {
    const registryUrl = (options.registryUrl || DEFAULT_REGISTRY_URL).replace(/\/$/, "");
    const res = await fetch(`${registryUrl}/api/v1/verify/signature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: options.address,
        message: options.message,
        signature: options.signature,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Signature verification failed with HTTP ${res.status}`);
    }

    return await res.json();
  }

  /**
   * Issues a verifiable Agent Passport Token (AVC)
   */
  static issuePassport(params: Parameters<typeof issueAgentPassportToken>[0]): AgentPassportToken {
    return issueAgentPassportToken(params);
  }

  /**
   * Completely offline, 0ms verification of an Agent Passport Token
   */
  static verifyPassportOffline(token: AgentPassportToken, expectedRootPublicKey?: string) {
    return verifyAgentPassportTokenOffline(token, expectedRootPublicKey);
  }

  /**
   * Creates an Ed25519-signed Proof of Execution (PoE) Receipt
   */
  static createReceipt(params: CreateReceiptParams): ExecutionReceipt {
    return createExecutionReceipt(params);
  }

  /**
   * Verifies an Execution Receipt (hashes and Ed25519 signature)
   */
  static verifyReceipt(params: VerifyReceiptParams) {
    return verifyExecutionReceipt(params);
  }

  /**
   * Gets the public key of the AID Root Authority
   */
  static getRootPublicKey(): string {
    return getAidRootPublicKey();
  }
}

export {
  issueAgentPassportToken,
  verifyAgentPassportTokenOffline,
  createExecutionReceipt,
  verifyExecutionReceipt,
  getAidRootPublicKey,
};
export type { AgentPassportToken, ExecutionReceipt, CreateReceiptParams, VerifyReceiptParams };

export default AID;

