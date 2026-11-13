import { NextRequest, NextResponse } from "next/server";
import { getSession, Session } from "./session";
import { JiraError } from "./jira";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Ctx = { params: Record<string, string> };

/** Wraps an API handler: requires a signed-in session and turns errors into JSON responses. */
export function route(handler: (req: NextRequest, s: Session, ctx: Ctx) => Promise<unknown>) {
  return async (req: NextRequest, ctx: Ctx) => {
    try {
      const s = await getSession();
      if (!s) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
      const data = await handler(req, s, ctx);
      return NextResponse.json(data ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof JiraError) {
        const status = e.status === 401 || e.status === 403 || e.status === 404 || e.status === 400 ? e.status : 502;
        return NextResponse.json({ error: e.message }, { status });
      }
      console.error(e);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  };
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const KEY_RE = /^[A-Za-z][A-Za-z0-9_]*-\d+$/;
export const PROJECT_RE = /^[A-Za-z][A-Za-z0-9_]*$/;

export function mustDate(v: string | null, name: string): string {
  if (!v || !DATE_RE.test(v)) throw new HttpError(400, `${name} must be YYYY-MM-DD`);
  return v;
}

export function mustKey(v: string): string {
  if (!KEY_RE.test(v)) throw new HttpError(400, "Invalid issue key");
  return v.toUpperCase();
}

/** Escape a value for use inside a double-quoted JQL string. */
export const jqlStr = (v: string) => v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
