import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { appUrl, env } from "@/lib/env";
import { cookieOpts } from "@/lib/session";

export const dynamic = "force-dynamic";

const DEFAULT_SCOPES = "read:jira-user read:jira-work write:jira-work offline_access";

export function GET() {
  const state = randomBytes(16).toString("hex");
  const url = new URL("https://auth.atlassian.com/authorize");
  url.searchParams.set("audience", "api.atlassian.com");
  url.searchParams.set("client_id", env("ATLASSIAN_CLIENT_ID"));
  url.searchParams.set("scope", env("ATLASSIAN_SCOPES", true) || DEFAULT_SCOPES);
  url.searchParams.set("redirect_uri", `${appUrl()}/api/auth/callback`);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("prompt", "consent");

  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", state, cookieOpts(600));
  return res;
}
