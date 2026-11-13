import { DATE_RE, HttpError, jqlStr, KEY_RE, PROJECT_RE, route } from "@/lib/api";
import { jira } from "@/lib/jira";
import { buildFields } from "@/lib/issueFields";

export const dynamic = "force-dynamic";

const LIST_FIELDS = [
  "summary",
  "status",
  "issuetype",
  "priority",
  "assignee",
  "project",
  "parent",
  "duedate",
  "timeoriginalestimate",
  "timespent",
  "updated",
  "created",
].join(",");

export const GET = route(async (req, s) => {
  const p = req.nextUrl.searchParams;
  const clauses: string[] = [];

  const project = p.get("project");
  if (project) {
    if (!PROJECT_RE.test(project)) throw new HttpError(400, "Invalid project");
    clauses.push(`project = "${project}"`);
  }

  const sprint = p.get("sprint");
  if (sprint === "open") clauses.push("sprint in openSprints()");
  else if (sprint) {
    if (!/^\d+$/.test(sprint)) throw new HttpError(400, "Invalid sprint");
    clauses.push(`sprint = ${sprint}`);
  }

  if (p.get("assignee") !== "all") clauses.push("assignee = currentUser()");

  const q = (p.get("q") ?? "").trim();
  if (q) {
    // task / bug id (ABC-123) matches the key exactly; anything else searches titles and descriptions
    clauses.push(KEY_RE.test(q) ? `key = "${q.toUpperCase()}"` : `text ~ "${jqlStr(q)}*"`);
  }

  const field = ["created", "updated", "duedate"].includes(p.get("dateField") ?? "") ? p.get("dateField")! : "updated";
  const from = p.get("from");
  const to = p.get("to");
  if (from) {
    if (!DATE_RE.test(from)) throw new HttpError(400, "Invalid from date");
    clauses.push(`${field} >= "${from}"`);
  }
  if (to) {
    if (!DATE_RE.test(to)) throw new HttpError(400, "Invalid to date");
    clauses.push(`${field} <= "${to}"`);
  }

  const jql = (clauses.length ? clauses.join(" AND ") : "assignee = currentUser()") + " ORDER BY updated DESC";
  const params = new URLSearchParams({ jql, fields: LIST_FIELDS, maxResults: "30" });
  const token = p.get("nextPageToken");
  if (token) params.set("nextPageToken", token);

  const r = await jira(s, `/rest/api/3/search/jql?${params}`);
  return {
    issues: (r.issues ?? []).map((i: any) => ({
      key: i.key,
      summary: i.fields.summary,
      status: i.fields.status?.name ?? "",
      statusCategory: i.fields.status?.statusCategory?.key ?? "",
      type: i.fields.issuetype?.name ?? "",
      subtask: Boolean(i.fields.issuetype?.subtask),
      priority: i.fields.priority?.name ?? "",
      assignee: i.fields.assignee?.displayName ?? "",
      project: i.fields.project?.key ?? "",
      parentKey: i.fields.parent?.key ?? null,
      dueDate: i.fields.duedate ?? null,
      estimateSec: i.fields.timeoriginalestimate ?? 0,
      spentSec: i.fields.timespent ?? 0,
      updated: i.fields.updated,
    })),
    nextPageToken: r.nextPageToken ?? null,
  };
});

export const POST = route(async (req, s) => {
  const body = await req.json();
  const fields = buildFields(body, s, "create");
  const r = await jira(s, "/rest/api/3/issue", { method: "POST", body: JSON.stringify({ fields }) });
  return { key: r.key };
});
