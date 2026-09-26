import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accept = request.headers.get("accept") || "";
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();

  const isMachineClient =
    accept.includes("application/json") ||
    userAgent.includes("curl") ||
    userAgent.includes("wget") ||
    userAgent.includes("python") ||
    userAgent.includes("httpie") ||
    userAgent.includes("langchain") ||
    userAgent.includes("crewai") ||
    userAgent.includes("bot");

  // 1. Root route: Return machine manifest and quickstart for AI agents and CLI tools
  if (pathname === "/") {
    if (isMachineClient && !accept.includes("text/html")) {
      return NextResponse.json(
        {
          name: "AID Protocol",
          tagline: "Machine-Verifiable Agent Identity Directory & Trust Infrastructure",
          version: "1.0.0",
          documentation: "https://aid.ledpa7.com/llms.txt",
          manifest: "https://aid.ledpa7.com/.well-known/agent.json",
          quickstart: {
            resolve: "GET /api/v1/resolve/:address",
            register: "POST /api/v1/agents",
            challenge: "POST /api/v1/verify/challenge",
            signature: "POST /api/v1/verify/signature",
            passport: "POST /api/v1/attest/passport",
          },
          mcp: {
            command: "npx -y aid-mcp --registry https://aid.ledpa7.com",
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
          },
        }
      );
    }
  }

  // 2. Direct Address route (e.g. /scout@github or /aid_01...):
  // When accessed by curl or machine agents without text/html, rewrite to resolve API
  const isDirectAddress =
    pathname.length > 1 &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/directory") &&
    !pathname.startsWith("/favicon") &&
    !pathname.startsWith("/.well-known") &&
    (pathname.includes("@") || pathname.toLowerCase().startsWith("/aid_"));

  if (isDirectAddress && isMachineClient && !accept.includes("text/html")) {
    const address = pathname.slice(1);
    const rewriteUrl = new URL(`/api/v1/resolve/${address}`, request.url);
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
