import { createHash } from "crypto";
import dns from "node:dns/promises";
import net from "node:net";

export interface SafeFetchResult {
  ok: boolean;
  data?: any;
  hash?: string;
  error?: string;
}

/**
 * Validates whether an IPv4 address belongs to a private, loopback, or cloud metadata subnet.
 */
export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed -> reject
  }
  const [a, b, c] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 10.0.0.0/8 (Private)
  if (a === 10) return true;
  // 100.64.0.0/10 (Carrier-Grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (Link Local / Cloud Metadata Service e.g. AWS IMDS)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (Private)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && c === 0) return true;
  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true;
  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;
  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;
  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved) & Broadcast
  if (a >= 224) return true;

  return false;
}

/**
 * Validates whether an IPv6 address belongs to a loopback, unique local, link-local, or IPv4-mapped private subnet.
 */
export function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // IPv4-mapped IPv6 address (e.g. ::ffff:127.0.0.1 or ::ffff:169.254.169.254)
  if (normalized.startsWith("::ffff:")) {
    const v4Part = normalized.slice("::ffff:".length);
    if (net.isIPv4(v4Part)) {
      return isPrivateIPv4(v4Part);
    }
    return true; // Non-standard hex mapped -> reject
  }

  // ::1 (Loopback) & :: (Unspecified)
  if (normalized === "::1" || normalized === "::") return true;

  // fc00::/7 (Unique local / ULA)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // fe80::/10 (Link-local)
  if (/^fe[89ab]/i.test(normalized)) return true;

  // ff00::/8 (Multicast)
  if (normalized.startsWith("ff")) return true;

  // 64:ff9b::/96 (IPv4/IPv6 translation)
  if (normalized.startsWith("64:ff9b:")) return true;

  return false;
}

/**
 * Returns true if an IP is not a globally routable public IP.
 */
export function isDisallowedIP(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true;
}

/**
 * Fast synchronous check for prohibited hostname strings.
 */
export function isDisallowedHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".lan") ||
    normalized.endsWith(".home")
  ) {
    return true;
  }

  if (net.isIP(normalized)) {
    return isDisallowedIP(normalized);
  }

  return false;
}

/**
 * Validates that a hostname resolves strictly to public, non-private IP addresses.
 * Defends against DNS Rebinding and local network probing.
 */
export async function validateHostIsSafe(hostname: string): Promise<{ safe: boolean; error?: string }> {
  const normalized = hostname.trim().toLowerCase();

  if (isDisallowedHost(normalized)) {
    return { safe: false, error: `Access to local or private hostname (${normalized}) is blocked by SSRF Guard.` };
  }

  try {
    const records = await dns.lookup(normalized, { all: true });
    if (!records || records.length === 0) {
      return { safe: false, error: `DNS resolution failed: no IP records found for ${normalized}.` };
    }

    for (const record of records) {
      if (isDisallowedIP(record.address)) {
        return {
          safe: false,
          error: `Host ${normalized} resolved to disallowed private IP (${record.address}). SSRF blocked.`,
        };
      }
    }
  } catch (err: any) {
    return { safe: false, error: `DNS lookup failed for ${normalized}: ${err.message}` };
  }

  return { safe: true };
}

/**
 * Fetches an Agent Card JSON payload securely:
 * - HTTPS / HTTP protocol validation
 * - Standard web port restriction (80, 443)
 * - DNS resolution & private IP block (SSRF & DNS Rebinding protection)
 * - Manual redirect inspection (intercepts open redirect SSRF hops)
 * - 5-second timeout & 512KB payload ceiling
 */
export async function safeFetchAgentCard(urlStr: string, maxRedirects = 3): Promise<SafeFetchResult> {
  let currentUrl = urlStr;
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    let parsed: URL;
    try {
      parsed = new URL(currentUrl);
    } catch {
      return { ok: false, error: "Invalid URL string provided." };
    }

    // Protocol check
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, error: "Protocol must be HTTP or HTTPS." };
    }

    // Port check: allow standard HTTP/HTTPS ports only
    const port = parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === "https:" ? 443 : 80;
    if (port !== 80 && port !== 443) {
      return { ok: false, error: `Access to non-standard port ${port} is blocked by SSRF Guard.` };
    }

    // Validate hostname and resolve DNS IPs
    const hostValidation = await validateHostIsSafe(parsed.hostname);
    if (!hostValidation.safe) {
      return { ok: false, error: hostValidation.error || "Blocked by SSRF Guard." };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual", // Do NOT automatically follow redirects!
        headers: {
          Accept: "application/json",
          "User-Agent": "AID-Inspector/0.2 (+https://aid-beryl.vercel.app)",
        },
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      return { ok: false, error: err.message || "Failed to fetch remote card." };
    }
    clearTimeout(timeoutId);

    // Intercept redirects (301, 302, 307, 308)
    if (response.status >= 300 && response.status < 400) {
      redirectCount++;
      if (redirectCount > maxRedirects) {
        return { ok: false, error: `Exceeded maximum redirect limit (${maxRedirects}).` };
      }

      const locationHeader = response.headers.get("location");
      if (!locationHeader) {
        return { ok: false, error: "Redirect response missing Location header." };
      }

      currentUrl = new URL(locationHeader, currentUrl).toString();
      continue;
    }

    if (!response.ok) {
      return { ok: false, error: `Remote endpoint returned HTTP ${response.status}.` };
    }

    const text = await response.text();
    if (text.length > 512 * 1024) {
      return { ok: false, error: "Agent card payload exceeds maximum size limit (512KB)." };
    }

    try {
      const json = JSON.parse(text);
      const hash = createHash("sha256").update(text).digest("hex");
      return { ok: true, data: json, hash };
    } catch {
      return { ok: false, error: "Remote response is not valid JSON." };
    }
  }

  return { ok: false, error: "Failed to fetch agent card within redirect limits." };
}
