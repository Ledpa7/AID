import { ResolutionResponse } from "./types";

export function formatTerminalCard(res: ResolutionResponse): string {
  const reset = "\x1b[0m";
  const bold = "\x1b[1m";
  const dim = "\x1b[2m";
  const cyan = "\x1b[36m";
  const green = "\x1b[32m";
  const magenta = "\x1b[35m";
  const yellow = "\x1b[33m";
  const grey = "\x1b[90m";
  const red = "\x1b[31m";

  const domainStatus = res.verification.domain ? `${green}✓ Verified${reset}` : `${grey}✗ Unverified${reset}`;
  const keyStatus = res.verification.key ? `${green}✓ Verified${reset}` : `${grey}✗ None${reset}`;
  const cardStatus = res.verification.card ? `${green}✓ Valid${reset}` : `${grey}✗ Not found${reset}`;

  const limitedNotice = res.isLimited
    ? `\n  ${bold}${red}⚠ [ NOTICE: Full Functionality Not Supported / Closed Ecosystem ]${reset}\n  ${red}${res.limitedReason || "External API/MCP invocation is currently unavailable."}${reset}\n`
    : "";

  const endpointsList = res.endpoints.length > 0
    ? res.endpoints
        .map(
          (ep) =>
            `    ${cyan}• [${ep.protocol.toUpperCase()}]${reset} ${ep.url} ${
              ep.isPrimary ? `${yellow}(primary)${reset}` : ""
            }`
        )
        .join("\n")
    : `    ${grey}(None configured)${reset}`;

  return `
${bold}${magenta}┌────────────────────────────────────────────────────────────────────────┐${reset}
${bold}${magenta}│${reset}  ${bold}${cyan}AID AGENT PASSPORT${reset} ${grey}— Verifiable AI Identity${reset}                      ${bold}${magenta}│${reset}
${bold}${magenta}├────────────────────────────────────────────────────────────────────────┤${reset}
  ${bold}Address:${reset}       ${bold}${green}${res.address}${reset}
  ${bold}Permanent AID:${reset} ${yellow}${res.aid}${reset}
  ${bold}Status:${reset}        ${green}${res.status}${reset} (${res.visibility})${limitedNotice}

  ${bold}${cyan}[ TRUST EVIDENCE ]${reset}
  • Domain (${res.namespace.domain || "N/A"}): ${domainStatus}
  • Cryptographic Key:        ${keyStatus}
  • Agent Card Metadata:      ${cardStatus}

  ${bold}${cyan}[ ENDPOINTS ]${reset}
${endpointsList}

  ${bold}${cyan}[ DEVELOPER QUICKSTART ]${reset}
  • README Badge: ${grey}[![AID](https://aid.dev/api/v1/badge/${res.address})](https://aid.dev/${res.address})${reset}
  • Resolve JSON: ${dim}curl -s https://aid.dev/api/v1/resolve/${res.address}${reset}
${bold}${magenta}└────────────────────────────────────────────────────────────────────────┘${reset}
`;
}
