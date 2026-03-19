import { NextRequest, NextResponse } from "next/server";
import { networks, NetworkId } from "@/lib/networks";

export async function POST(req: NextRequest) {
  const networkId = (req.nextUrl.searchParams.get("network") ?? "devnet") as NetworkId;
  const path = req.nextUrl.searchParams.get("path") ?? "/network/status";
  const network = networks[networkId];
  if (!network) {
    return NextResponse.json({ error: "Invalid network" }, { status: 400 });
  }

  const body = await req.text();

  const res = await fetch(`${network.rosettaUrl}${path}`, {
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
}
