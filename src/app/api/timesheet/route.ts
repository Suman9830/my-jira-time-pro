import { HttpError, mustDate, route } from "@/lib/api";
import { fromAdf } from "@/lib/adf";
import { jira } from "@/lib/jira";
import { getPrefs } from "@/lib/prefs";

export const dynamic = "force-dynamic";

const MAX_ISSUES = 150;
const CONCURRENCY = 8;

/**
 * Worklogs between two dates.
 * scope=me   -> only your own entries
 * scope=team -> everyone's entries you can see in Jira (only if "show team" is enabled in your preferences)
 */
export const GET = route(async (req, s) => {
  const p = req.nextUrl.searchParams;
  const from = mustDate(p.get("from"), "from");
  const to = mustDate(p.get("to"), "to");
  const team = p.get("scope") === "team";

  if (team && !(await getPrefs(s.accountId)).showTeam) {
    throw new HttpError(403, "Enable team timesheets in Settings first");
  }

  const jql = `worklogDate >= "${from}" AND worklogDate <= "${to}"` + (team ? "" : " AND worklogAuthor = currentUser()");

  const issues: { key: string; summary: string; project: string }[] = [];
  let token: string | null = null;
  do {
    const params = new URLSearchParams({ jql, fields: "summary,project", maxResults: "100" });
    if (token) params.set("nextPageToken", token);
    const r = await jira(s, `/rest/api/3/search/jql?${params}`);
    for (const i of r.issues ?? []) {
      issues.push({ key: i.key, summary: i.fields.summary, project: i.fields.project?.key ?? "" });
    }
    token = r.nextPageToken ?? null;
  } while (token && issues.length < MAX_ISSUES);
  const truncated = Boolean(token) || issues.length > MAX_ISSUES;
  issues.length = Math.min(issues.length, MAX_ISSUES);

  const entries: unknown[] = [];
  let next = 0;
  async function worker() {
    while (next < issues.length) {
      const issue = issues[next++];
      const r = await jira(s, `/rest/api/3/issue/${issue.key}/worklog?maxResults=1000`).catch(() => ({ worklogs: [] }));
      for (const w of r.worklogs ?? []) {
        const date = String(w.started).slice(0, 10);
        if (date < from || date > to) continue;
        if (!team && w.author?.accountId !== s.accountId) continue;
        entries.push({
          id: w.id,
          issueKey: issue.key,
          summary: issue.summary,
          project: issue.project,
          authorId: w.author?.accountId ?? "",
          author: w.author?.displayName ?? "Unknown",
          date,
          start: String(w.started).slice(11, 16),
          seconds: w.timeSpentSeconds ?? 0,
          comment: fromAdf(w.comment).trim(),
          mine: w.author?.accountId === s.accountId,
        });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, issues.length) }, worker));

  return { entries, truncated };
});
