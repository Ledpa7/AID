import dns from "node:dns/promises";
import crypto from "crypto";

export interface DnsVerificationResult {
  success: boolean;
  matchedRecord?: string;
  queriedHosts: string[];
  recordsFound: string[];
  error?: string;
}

/**
 * Sanitizes a domain name by stripping protocol, path, and port.
 */
export function sanitizeDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

/**
 * Generates a standard, secure verification token for a domain.
 */
export function generateDomainChallengeToken(slug: string, domain: string): string {
  const cleanDomain = sanitizeDomain(domain);
  const hash = crypto
    .createHash("sha256")
    .update(`${slug}:${cleanDomain}`)
    .digest("hex")
    .substring(0, 24);
  return `aid-verification=${hash}`;
}

/**
 * Queries DNS TXT records using public resolvers (Google 8.8.8.8, Cloudflare 1.1.1.1)
 * to bypass local resolver cache and check for the challenge token.
 */
export async function verifyDnsTxtRecord(
  domain: string,
  expectedToken: string
): Promise<DnsVerificationResult> {
  const cleanDomain = sanitizeDomain(domain);
  if (!cleanDomain) {
    return {
      success: false,
      queriedHosts: [],
      recordsFound: [],
      error: "Invalid or empty domain provided.",
    };
  }

  // Create dedicated resolver pointing to Google & Cloudflare DNS
  const resolver = new dns.Resolver();
  resolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

  // We check both the designated subdomain '_aid.domain' and root 'domain'
  const hostsToQuery = [`_aid.${cleanDomain}`, cleanDomain];
  const allRecordsFound: string[] = [];

  for (const host of hostsToQuery) {
    try {
      const txtRecords = await resolver.resolveTxt(host);
      // resolveTxt returns string[][] (chunks of TXT record)
      const flattened = txtRecords.map((chunk) => chunk.join(""));
      allRecordsFound.push(...flattened);

      // Check if any TXT record matches the expected challenge token
      for (const record of flattened) {
        if (record.trim() === expectedToken.trim() || record.includes(expectedToken.trim())) {
          return {
            success: true,
            matchedRecord: record,
            queriedHosts: hostsToQuery,
            recordsFound: allRecordsFound,
          };
        }
      }
    } catch (err: any) {
      // ENODATA or ENOTFOUND is expected if host has no TXT record
      if (err.code !== "ENODATA" && err.code !== "ENOTFOUND" && err.code !== "ESERVFAIL") {
        console.warn(`DNS query warning for ${host}:`, err.message);
      }
    }
  }

  return {
    success: false,
    queriedHosts: hostsToQuery,
    recordsFound: allRecordsFound,
    error:
      allRecordsFound.length > 0
        ? `TXT records were found on ${hostsToQuery.join(" or ")}, but none matched '${expectedToken}'.`
        : `No TXT records found on ${hostsToQuery.join(" or ")}. Please ensure DNS propagation is complete (typically 1-5 minutes).`,
  };
}
