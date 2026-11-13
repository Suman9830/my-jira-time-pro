import { NextRequest, NextResponse } from "next/server";
import { appUrl, env } from "@/lib/env";
import { createSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const fail = (reason: string) => NextResponse.redirect(`${appUrl()}/login?error=${encodeURIComponent(reason)}`);

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const saved = req.cookies.get("oauth_state")?.value;
    if (req.nextUrl.searchParams.get("error")) return fail("Sign-in was cancelled");
    if (!code || !state || !saved || state !== saved) return fail("Invalid sign-in state, try again");

    const tokenRes = await fetch("https://auth.atlassian.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: env("ATLASSIAN_CLIENT_ID"),
        client_secret: env("ATLASSIAN_CLIENT_SECRET"),
        code,
        redirect_uri: `${appUrl()}/api/auth/callback`,
      }),
    });
    if (!tokenRes.ok) return fail("Could not complete sign-in with Atlassian");
    const token = await tokenRes.json();

    const sitesRes = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
      headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" },
    });
    const sites: { id: string; url: string }[] = await sitesRes.json();
    if (!Array.isArray(sites) || !sites.length) return fail("No Jira site is accessible to this account");

    const wanted = env("JIRA_SITE_URL", true).replace(/\/$/, "");
    const site = (wanted && sites.find((x) => x.url === wanted)) || sites[0];

    const meRes = await fetch(`https://api.atlassian.com/ex/jira/${site.id}/rest/api/3/myself`, {
      headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" },
    });
    if (!meRes.ok) return fail("Could not read your Jira profile");
    const me = await meRes.json();

    await createSession({
      accountId: me.accountId,
      name: me.displayName,
      avatar: me.avatarUrls?.["48x48"] ?? null,
      cloudId: site.id,
      siteUrl: site.url,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: Date.now() + token.expires_in * 1000,
    });

    const res = NextResponse.redirect(`${appUrl()}/`);
    res.cookies.set("oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error(e);
    return fail("Sign-in failed");
  }
}
