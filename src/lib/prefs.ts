import { q } from "./db";

export interface Prefs {
  showTeam: boolean;
  defaultProject: string | null;
}

export async function getPrefs(accountId: string): Promise<Prefs> {
  const rows = await q<{ show_team: boolean; default_project: string | null }>(
    `select show_team, default_project from user_prefs where account_id = $1`,
    [accountId]
  );
  return { showTeam: rows[0]?.show_team ?? false, defaultProject: rows[0]?.default_project ?? null };
}

export async function savePrefs(accountId: string, p: Prefs): Promise<void> {
  await q(
    `insert into user_prefs (account_id, show_team, default_project, updated_at) values ($1,$2,$3, now())
     on conflict (account_id) do update set show_team = $2, default_project = $3, updated_at = now()`,
    [accountId, p.showTeam, p.defaultProject]
  );
}
