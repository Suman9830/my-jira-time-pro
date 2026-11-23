import { env } from "./env";
import { Session, updateTokens } from "./session";

export class JiraError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const refreshing = new Map<string, Promise<void>>();

async function doRefresh(s: Session): Promise<void> {
  const res = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: env("ATLASSIAN_CLIENT_ID"),
      client_secret: env("ATLASSIAN_CLIENT_SECRET"),
      refresh_token: s.refreshToken,
    }),
  });
  if (!res.ok) throw new JiraError(401, "Session expired. Please sign in again.");
  const t = await res.json();
  s.accessToken = t.access_token;
  s.refreshToken = t.refresh_token ?? s.refreshToken;
  s.expiresAt = Date.now() + t.expires_in * 1000;
  await updateTokens(s);
}

/** Refresh once per session even when many requests fire together (refresh tokens rotate). */
export async function ensureFresh(s: Session): Promise<void> {
  if (s.expiresAt - Date.now() > 60_000) return;
  let p = refreshing.get(s.id);
  if (!p) {
    p = doRefresh(s).finally(() => refreshing.delete(s.id));
    refreshing.set(s.id, p);
  }
  await p;
}

function explain(status: number, text: string): string {
  try {
    const j = JSON.parse(text);
    const parts = [...(j.errorMessages ?? []), ...Object.values(j.errors ?? {})].filter(Boolean);
    if (parts.length) return parts.join("; ");
    if (j.message) return String(j.message);
  } catch {
    /* not json */
  }
  return `Jira request failed (${status})`;
}

/** Call the Jira Cloud REST API as the signed-in user. `path` starts with /rest/... */
export async function jira<T = any>(s: Session, path: string, init: RequestInit = {}): Promise<T> {
  await ensureFresh(s);
  const res = await fetch(`https://api.atlassian.com/ex/jira/${s.cloudId}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${s.accessToken}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) throw new JiraError(res.status, explain(res.status, await res.text()));
  if (res.status === 204) return null as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}
