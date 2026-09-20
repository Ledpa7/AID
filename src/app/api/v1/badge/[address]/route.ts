import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const rawAddress = decodeURIComponent(params.address || "").toLowerCase();
    const resolution = await AIDStore.resolveAddress(rawAddress);

    let statusText = "not found";
    let statusColor = "#ef4444"; // red
    let isVerified = false;

    if (resolution) {
      isVerified = resolution.verification.domain || resolution.verification.key;
      if (resolution.status !== "ACTIVE") {
        statusText = resolution.status.toLowerCase();
        statusColor = "#f59e0b"; // amber
      } else if (isVerified) {
        statusText = "verified";
        statusColor = "#10b981"; // emerald
      } else {
        statusText = "registered";
        statusColor = "#facc15"; // neon yellow
      }
    }

    const leftLabel = `aid : ${rawAddress || "agent"}`;
    // Approximate SVG text width calculation
    const leftWidth = Math.max(65, leftLabel.length * 6.8 + 16);
    const rightWidth = Math.max(50, statusText.length * 7 + 22);
    const totalWidth = leftWidth + rightWidth;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${leftLabel}: ${statusText}">
  <title>${leftLabel}: ${statusText}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#1e293b"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${statusColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${leftWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${leftLabel}</text>
    <text x="${leftWidth / 2}" y="14" fill="#f1f5f9">${leftLabel}</text>
    <text aria-hidden="true" x="${leftWidth + rightWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${statusText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="14" fill="#fff" font-weight="bold">${statusText}</text>
  </g>
</svg>`;

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="20">
      <rect width="100" height="20" rx="3" fill="#ef4444"/>
      <text x="50" y="14" fill="#fff" text-anchor="middle" font-family="sans-serif" font-size="11">aid : error</text>
    </svg>`;

    return new NextResponse(errorSvg, {
      status: 500,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
      },
    });
  }
}
