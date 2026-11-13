import { HttpError, PROJECT_RE, route } from "@/lib/api";
import { jira } from "@/lib/jira";

export const dynamic = "force-dynamic";

export const GET = route(async (_req, s, { params }) => {
  if (!PROJECT_RE.test(params.key)) throw new HttpError(400, "Invalid project key");
  const r = await jira(s, `/rest/api/3/issue/createmeta/${params.key}/issuetypes`);
  const list = r.issueTypes ?? r.values ?? [];
  return list.map((t: any) => ({ id: t.id, name: t.name, subtask: Boolean(t.subtask) }));
});
