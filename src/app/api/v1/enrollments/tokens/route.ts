import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";

export const runtime = "nodejs";

/**
 * POST /api/v1/enrollments/tokens
 * Creates an Enrollment Token for a namespace with Sybil-resistant quotas.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { namespaceSlug, name, maxAgents, expiresInDays, scopes } = body;

    if (!namespaceSlug || !name) {
      return NextResponse.json(
        { error: "Fields 'namespaceSlug' and 'name' are required." },
        { status: 400 }
      );
    }

    const result = await AIDStore.createEnrollmentToken({
      namespaceSlug: namespaceSlug.toLowerCase().trim(),
      name: name.trim(),
      maxAgents: typeof maxAgents === "number" ? maxAgents : 10,
      expiresInDays: typeof expiresInDays === "number" ? expiresInDays : 30,
      scopes: Array.isArray(scopes) ? scopes : ["agent:create"],
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Enrollment token generated successfully. Save this token securely; it will NOT be displayed again.",
        token: result.token,
        enrollmentToken: result.enrollmentToken,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create enrollment token." },
      { status: 400 }
    );
  }
}

/**
 * GET /api/v1/enrollments/tokens?namespace=slug
 * Lists enrollment tokens for a specific namespace (without leaking raw secret tokens).
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const namespace = (searchParams.get("namespace") || "").trim().toLowerCase();

    if (!namespace) {
      return NextResponse.json(
        { error: "Query parameter 'namespace' is required." },
        { status: 400 }
      );
    }

    const tokens = await AIDStore.listEnrollmentTokens(namespace);
    return NextResponse.json({ success: true, namespace, tokens }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list enrollment tokens." },
      { status: 500 }
    );
  }
}
