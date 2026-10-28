import { NextResponse } from "next/server";
import { buildSample } from "@/lib/samples";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/audit/sample?type=local|saas returns an example report for a fictional business. */
export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type") ?? "";
  const report = buildSample(type);
  if (!report) {
    return NextResponse.json({ error: "Unknown sample report." }, { status: 400 });
  }
  return NextResponse.json(report);
}
