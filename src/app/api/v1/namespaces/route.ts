import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/ratelimit";

export async function GET() {
  try {
    const namespaces = await AIDStore.getNamespaces();
    return NextResponse.json({ namespaces });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`create_namespace:${clientIp}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!rateCheck.success) {
      return createRateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const { slug, name, domain } = body;

    if (!slug || !name) {
      return NextResponse.json(
        { error: "Fields 'slug' and 'name' are required." },
        { status: 400 }
      );
    }

    const cleanSlug = slug.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,32}$/.test(cleanSlug)) {
      return NextResponse.json(
        { error: "Namespace slug must be 2-32 lowercase alphanumeric characters or hyphens." },
        { status: 400 }
      );
    }

    const created = await AIDStore.createNamespace(cleanSlug, name.trim(), domain ? domain.trim() : undefined);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

