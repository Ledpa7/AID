import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";

export const runtime = "nodejs";

/**
 * POST /api/v1/enrollments
 * Agent-native autonomous enrollment endpoint.
 * Accepts enrollment token via Authorization header (Bearer aid_enroll_...) or body.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    let bearerToken = "";
    if (authHeader.toLowerCase().startsWith("bearer ")) {
      bearerToken = authHeader.slice(7).trim();
    }

    const body = await req.json().catch(() => ({}));
    const token = bearerToken || body.token;
    const { alias, displayName, endpointUrl, protocol, publicKey, description, category } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Missing enrollment token in Authorization header or request body." },
        { status: 401 }
      );
    }

    if (!alias || !displayName || !endpointUrl) {
      return NextResponse.json(
        { error: "Fields 'alias', 'displayName', and 'endpointUrl' are required." },
        { status: 400 }
      );
    }

    const enrollmentResult = await AIDStore.enrollAgent({
      token,
      alias,
      displayName,
      endpointUrl,
      protocol: protocol || "a2a",
      publicKey,
      description,
      category,
    });

    return NextResponse.json(enrollmentResult, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Enrollment failed." },
      { status: 400 }
    );
  }
}
