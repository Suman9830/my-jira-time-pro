import { mustKey, route } from "@/lib/api";
import { fromAdf } from "@/lib/adf";
import { env } from "@/lib/env";
import { jira } from "@/lib/jira";
import { buildFields } from "@/lib/issueFields";

export const dynamic = "force-dynamic";

export const GET = route(async (_req, s, { params }) => {
  const key = mustKey(params.key);
  const startField = env("JIRA_START_DATE_FIELD", true);
  const fields = [
    "summary",
    "description",
    "issuetype",
    "priority",
    "labels",
    "duedate",
    "timetracking",
    "parent",
    "project",
    "status",
    "timeoriginalestimate",
    "timespent",
    "timeestimate",
  ];
  if (startField) fields.push(startField);

  const i = await jira(s, `/rest/api/3/issue/${key}?fields=${fields.join(",")}`);
  const f = i.fields;
  return {
    key: i.key,
    summary: f.summary ?? "",
    description: fromAdf(f.description).trim(),
    issueType: f.issuetype?.name ?? "",
    isSubtask: Boolean(f.issuetype?.subtask),
    status: f.status?.name ?? "",
    statusCategory: f.status?.statusCategory?.key ?? "",
    priority: f.priority?.name ?? "",
    labels: f.labels ?? [],
    dueDate: f.duedate ?? "",
    startDate: startField ? f[startField] ?? "" : "",
    originalEstimate: f.timetracking?.originalEstimate ?? "",
    estimateSec: f.timeoriginalestimate ?? 0,
    spentSec: f.timespent ?? 0,
    remainingSec: f.timeestimate ?? 0,
    projectKey: f.project?.key ?? "",
    parentKey: f.parent?.key ?? null,
  };
});

export const PUT = route(async (req, s, { params }) => {
  const key = mustKey(params.key);
  const fields = buildFields(await req.json(), s, "edit");
  await jira(s, `/rest/api/3/issue/${key}`, { method: "PUT", body: JSON.stringify({ fields }) });
  return { key };
});
