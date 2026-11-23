import { q } from "./db";
import { decrypt } from "./crypto";
import { ensureFresh } from "./jira";
import type { Session } from "./session";

/**
 * Atlassian Personal Data Reporting API.
 * https://developer.atlassian.com/cloud/jira/platform/user-privacy-developer-guide/
 *
 * Report every account whose personal data we store, then erase/refresh data for accounts
 * Atlassian says were closed or updated.
 */

const REPORT_URL = "https://api.atlassian.com/app/report-accounts/";
const BATCH = 90; // API limit is 90 accounts per request

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

interface ReportAccount {
  accountId: string;
  updatedAt: string;
}

export interface ReportResult {
  reported: number;
  closed: number;
  updated: number;
  purgedExpired: number;
  skipped?: string;
}

/** Find a live session whose token we can use to call the reporting API. */
async function pickSession(): Promise<Session | null> {
  const rows = await q<Row>(
    `select * from sessions where created_at > now() - interval '30 days' order by created_at desc limit 5`
  );
  for (const r of rows) {
    const s: Session = {
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
    try {
      await ensureFresh(s);
      return s;
    } catch {
      // Refresh token rejected: this session is dead, remove it and try the next one.
      await q(`delete from sessions where id = $1`, [r.id]);
    }
  }
  return null;
}

async function listAccounts(): Promise<ReportAccount[]> {
  const rows = await q<{ account_id: string; updated_at: Date }>(
    `select account_id, max(ts) as updated_at from (
       select account_id, created_at as ts from sessions
       union all
       select account_id, updated_at as ts from user_prefs
     ) t group by account_id`
  );
  return rows.map((r) => ({ accountId: r.account_id, updatedAt: new Date(r.updated_at).toISOString() }));
}

/** Account closed: erase everything we hold for it. */
async function eraseAccount(accountId: string): Promise<void> {
  await q(`delete from sessions where account_id = $1`, [accountId]);
  await q(`delete from user_prefs where account_id = $1`, [accountId]);
}

/**
 * Profile changed: drop the stored profile copy (name/avatar) and tokens.
 * The user's next sign-in stores a fresh copy. Preferences contain no personal data.
 */
async function refreshAccount(accountId: string): Promise<void> {
  await q(`delete from sessions where account_id = $1`, [accountId]);
}

export async function runPersonalDataReport(): Promise<ReportResult> {
  // Sessions older than 30 days are already unusable; do not keep their personal data.
  const purged = await q(`delete from sessions where created_at <= now() - interval '30 days' returning id`);
  const result: ReportResult = { reported: 0, closed: 0, updated: 0, purgedExpired: purged.length };

  const accounts = await listAccounts();
  if (accounts.length === 0) return { ...result, skipped: "no accounts stored" };

  const s = await pickSession();
  if (!s) return { ...result, skipped: "no live session to authenticate the report" };

  for (let i = 0; i < accounts.length; i += BATCH) {
    const chunk = accounts.slice(i, i + BATCH);
    const res = await fetch(REPORT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${s.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accounts: chunk }),
    });

    if (res.status === 429) return { ...result, skipped: "rate limited, will retry next run" };
    if (res.status === 204) {
      result.reported += chunk.length;
      continue;
    }
    if (!res.ok) throw new Error(`Personal data report failed (${res.status})`);

    result.reported += chunk.length;
    const body = (await res.json()) as { accounts?: { accountId: string; status: string }[] };
    for (const a of body.accounts ?? []) {
      if (a.status === "closed") {
        await eraseAccount(a.accountId);
        result.closed++;
      } else if (a.status === "updated") {
        await refreshAccount(a.accountId);
        result.updated++;
      }
    }
  }
  return result;
}
