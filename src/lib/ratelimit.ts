import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window cache
const rateLimitCache = new Map<string, RateLimitRecord>();

// Prune expired entries periodically to prevent memory leaks
let lastPrune = Date.now();
const PRUNE_INTERVAL_MS = 60 * 1000; // 1 minute

function pruneExpired() {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;

  rateLimitCache.forEach((record, key) => {
    if (record.resetAt < now) {
      rateLimitCache.delete(key);
    }
  });
}

export interface RateLimitOptions {
  limit: number;     // Maximum requests per window
  windowMs: number;  // Window duration in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * Checks and updates rate limit for a given identifier key
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  pruneExpired();

  const now = Date.now();
  const record = rateLimitCache.get(key);

  if (!record || record.resetAt <= now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    rateLimitCache.set(key, newRecord);

    return {
      success: true,
      limit: options.limit,
      remaining: Math.max(0, options.limit - 1),
      resetAt: newRecord.resetAt,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (record.count >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, options.limit - record.count);

  return {
    success: true,
    limit: options.limit,
    remaining,
    resetAt: record.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
  };
}

/**
 * Extracts client IP safely from request headers
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

/**
 * Generates standard 429 Too Many Requests response with HTTP headers
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Too Many Requests",
      message: `Rate limit exceeded. Maximum ${result.limit} requests permitted per time window.`,
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": result.retryAfterSeconds.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
      },
    }
  );
}

/**
 * Resets a rate limit key (useful for unit testing)
 */
export function resetRateLimitKey(key: string): void {
  rateLimitCache.delete(key);
}
