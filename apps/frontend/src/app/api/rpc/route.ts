import { NextResponse } from "next/server";

const DEVNODE_RPC = process.env.DEVNODE_RPC_URL ?? "http://localhost:8547";

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(DEVNODE_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
