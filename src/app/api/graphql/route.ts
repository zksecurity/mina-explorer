import { NextRequest, NextResponse } from "next/server";
import { networks, NetworkId } from "@/lib/networks";

export async function POST(req: NextRequest) {
  const networkId = (req.nextUrl.searchParams.get("network") ?? "devnet") as NetworkId;
  const network = networks[networkId];
  if (!network) {
    return NextResponse.json({ error: "Invalid network" }, { status: 400 });
  }

  if (!network.graphqlUrl) {
    return NextResponse.json({ error: `No GraphQL URL configured for ${networkId}` }, { status: 500 });
  }

  const body = await req.text();

  try {
    const res = await fetch(network.graphqlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to reach ${networkId} GraphQL: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }
}
