import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { q } from "./db";
import { decrypt, encrypt } from "./crypto";

export interface Session {
  id: string;
  accountId: string;
  name: string;
  avatar: string | null;
  cloudId: string;
  siteUrl: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export const SESSION_COOKIE = "sid";
const MAX_AGE_S = 60 * 60 * 24 * 30;

export const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

interface Row {
  id: string;
  account_id: string;
  name: string;
  avatar: string | null;
  cloud_id: string;
  site_url: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export async function createSession(d: Omit<Session, "id">): Promise<void> {
  const id = randomBytes(32).toString("hex");
  await q(
    `insert into sessions (id, account_id, name, avatar, cloud_id, site_url, access_token, refresh_token, expires_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, d.accountId, d.name, d.avatar, d.cloudId, d.siteUrl, encrypt(d.accessToken), encrypt(d.refreshToken), d.expiresAt]
  );
  cookies().set(SESSION_COOKIE, id, cookieOpts(MAX_AGE_S));
}

export async function getSession(): Promise<Session | null> {
  const id = cookies().get(SESSION_COOKIE)?.value;
  if (!id || !/^[a-f0-9]{64}$/.test(id)) return null;
  const rows = await q<Row>(
    `select * from sessions where id = $1 and created_at > now() - interval '30 days'`,
    [id]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    accountId: r.account_id,
    name: r.name,
    avatar: r.avatar,
    cloudId: r.cloud_id,
    siteUrl: r.site_url,
    accessToken: decrypt(r.access_token),
    refreshToken: decrypt(r.refresh_token),
    expiresAt: Number(r.expires_at),
  };
}

export async function updateTokens(s: Session): Promise<void> {
  await q(`update sessions set access_token = $2, refresh_token = $3, expires_at = $4 where id = $1`, [
    s.id,
    encrypt(s.accessToken),
    encrypt(s.refreshToken),
    s.expiresAt,
  ]);
}

export async function destroySession(): Promise<void> {
  const id = cookies().get(SESSION_COOKIE)?.value;
  if (id && /^[a-f0-9]{64}$/.test(id)) await q(`delete from sessions where id = $1`, [id]);
  cookies().set(SESSION_COOKIE, "", cookieOpts(0));
}
