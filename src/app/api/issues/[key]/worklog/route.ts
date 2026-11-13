import { mustKey, route } from "@/lib/api";
import { fromAdf } from "@/lib/adf";
import { jira } from "@/lib/jira";
import { buildWorklogPayload } from "@/lib/worklogInput";

export const dynamic = "force-dynamic";

/** Every worklog on the issue, newest first. */
export const GET = route(async (_req, s, { params }) => {
  const key = mustKey(params.key);
  const r = await jira(s, `/rest/api/3/issue/${key}/worklog?maxResults=1000`);
  return (r.worklogs ?? [])
    .map((w: any) => ({
      id: w.id,
      issueKey: key,
      authorId: w.author?.accountId ?? "",
      author: w.author?.displayName ?? "Unknown",
      date: String(w.started).slice(0, 10),
      start: String(w.started).slice(11, 16),
      seconds: w.timeSpentSeconds ?? 0,
      comment: fromAdf(w.comment).trim(),
      mine: w.author?.accountId === s.accountId,
    }))
    .sort((a: any, b: any) => (a.date + a.start < b.date + b.start ? 1 : -1));
});

/** Log time. Body: { date, start: "HH:mm", end: "HH:mm", tzOffsetMin, comment? } */
export const POST = route(async (req, s, { params }) => {
  const key = mustKey(params.key);
  const payload = buildWorklogPayload(await req.json(), "create");
  const w = await jira(s, `/rest/api/3/issue/${key}/worklog`, { method: "POST", body: JSON.stringify(payload) });
  return { id: w.id };
});
