import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import { runPersonalDataReport } from "@/lib/personalData";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorised(req: NextRequest): boolean {
  const secret = env("CRON_SECRET");
  const given = req.headers.get("authorization") ?? "";
  const want = `Bearer ${secret}`;
  const a = Buffer.from(given);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Called daily by Vercel Cron (sends `Authorization: Bearer $CRON_SECRET`). */
export async function GET(req: NextRequest) {
  if (!authorised(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await runPersonalDataReport());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
