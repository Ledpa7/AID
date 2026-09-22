import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase();

    let agents = await AIDStore.getAgents();

    if (query) {
      agents = agents.filter(
        (a) =>
          a.primaryAddress.toLowerCase().includes(query) ||
          a.displayName.toLowerCase().includes(query) ||
          (a.description && a.description.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({
      total: agents.length,
      agents,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { namespace, alias, displayName, description, endpointUrl, protocol, publicKey, cardSnapshot, registeredBy } = body;

    if (!namespace || !alias || !displayName || !endpointUrl) {
      return NextResponse.json(
        { error: "Missing required fields: namespace, alias, displayName, endpointUrl" },
        { status: 400 }
      );
    }

    const newAgent = await AIDStore.registerAgent({
      namespaceSlug: namespace,
      alias,
      displayName,
      description,
      endpointUrl,
      protocol: protocol || "a2a",
      publicKey,
      cardSnapshot,
      registeredBy: registeredBy === "COMMUNITY" ? "COMMUNITY" : "OWNER",
    });

    return NextResponse.json(newAgent, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
