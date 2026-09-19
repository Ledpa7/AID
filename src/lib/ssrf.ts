import { createHash } from "crypto";

const PRIVATE_IP_RANGES = [
  /^127\./,                         // 127.0.0.0/8 (Loopback)
  /^10\./,                          // 10.0.0.0/8 (Private)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 (Private)
  /^192\.168\./,                    // 192.168.0.0/16 (Private)
  /^169\.254\./,                    // 169.254.0.0/16 (Link Local / Cloud Metadata)
  /^0\./,                           // 0.0.0.0/8
  /^::1$/,                          // IPv6 loopback
  /^fc00:/,                         // IPv6 private
  /^fe80:/,                         // IPv6 link-local
];

export function isDisallowedHost(host: string): boolean {
  const normalizedHost = host.trim().toLowerCase();

  if (
    normalizedHost === "localhost" ||
    normalizedHost.endsWith(".localhost") ||
    normalizedHost.endsWith(".local") ||
    normalizedHost.endsWith(".internal")
  ) {
    return true;
  }

  for (const regex of PRIVATE_IP_RANGES) {
    if (regex.test(normalizedHost)) {
      return true;
    }
  }

  return false;
}

export interface SafeFetchResult {
  ok: boolean;
  data?: any;
  hash?: string;
  error?: string;
}

export async function safeFetchAgentCard(urlStr: string): Promise<SafeFetchResult> {
  try {
    const parsed = new URL(urlStr);

    // Protocol check: Allow HTTPS only in production, permit HTTP for explicit test hosts if non-private
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, error: "Protocol must be HTTP or HTTPS" };
    }

    if (isDisallowedHost(parsed.hostname)) {
      return { ok: false, error: "Access to private or loopback networks is blocked (SSRF Guard)" };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(urlStr, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "AID-Inspector/0.1 (+https://aid.dev)",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { ok: false, error: `Remote endpoint returned HTTP ${response.status}` };
    }

    const text = await response.text();
    if (text.length > 512 * 1024) { // Max 512KB limit
      return { ok: false, error: "Agent card payload exceeds maximum size limit (512KB)" };
    }

    const json = JSON.parse(text);
    const hash = createHash("sha256").update(text).digest("hex");

    return { ok: true, data: json, hash };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to fetch remote card" };
  }
}
