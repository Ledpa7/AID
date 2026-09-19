import { NextRequest, NextResponse } from "next/server";
import { AIDStore } from "@/lib/store";

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
    const body = await request.json();
    const { slug, name, domain } = body;

    if (!slug || !name) {
      return NextResponse.json(
        { error: "Fields 'slug' and 'name' are required." },
        { status: 400 }
      );
    }

    const created = await AIDStore.createNamespace(slug, name, domain);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
