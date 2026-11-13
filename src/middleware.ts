import { NextRequest, NextResponse } from "next/server";

/** Cheap gate: pages need a session cookie. Real validation happens in the API routes. */
export function middleware(req: NextRequest) {
  if (!req.cookies.get("sid")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/timesheet", "/settings"] };
