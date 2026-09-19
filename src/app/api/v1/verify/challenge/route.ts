import { NextRequest, NextResponse } from "next/server";
import { generateChallenge } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject } = body;

    if (!subject || typeof subject !== "string") {
      return NextResponse.json(
        { error: "Field 'subject' (e.g. agent address or AID) is required." },
        { status: 400 }
      );
    }

    const challengeData = generateChallenge(subject.toLowerCase());

    return NextResponse.json(challengeData, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate challenge" },
      { status: 500 }
    );
  }
}
