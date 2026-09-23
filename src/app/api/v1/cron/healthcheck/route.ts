import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET / POST /api/v1/cron/healthcheck
 * Automated 1-hour background sentinel health check.
 * Triggered by Vercel Cron (schedule: "0 * * * *") or admin testing.
 */
export async function GET(req: NextRequest) {
  return handleHealthCheck(req);
}

export async function POST(req: NextRequest) {
  return handleHealthCheck(req);
}

async function handleHealthCheck(req: NextRequest) {
  try {
    // If CRON_SECRET is set in production environment, verify authorization header
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization") || "";
      const isCronTokenValid =
        authHeader === `Bearer ${cronSecret}` ||
        req.headers.get("x-cron-secret") === cronSecret;

      if (!isCronTokenValid) {
        return NextResponse.json(
          { error: "Unauthorized cron invocation. Invalid CRON_SECRET." },
          { status: 401 }
        );
      }
    }

    const report = await AIDStore.runGlobalHealthCheck();

    return NextResponse.json({
      success: true,
      message: "1-hour automated background health check completed successfully.",
      ...report,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute automated health check." },
      { status: 500 }
    );
  }
}
