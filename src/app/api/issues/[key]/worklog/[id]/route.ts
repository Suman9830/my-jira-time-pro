import { HttpError, mustKey, route } from "@/lib/api";
import { jira } from "@/lib/jira";
import { buildWorklogPayload } from "@/lib/worklogInput";

export const dynamic = "force-dynamic";

function mustId(id: string): string {
  if (!/^\d+$/.test(id)) throw new HttpError(400, "Invalid worklog id");
  return id;
}

/** Edit a worklog. Same body as creating one. Jira enforces that you can only edit your own. */
export const PUT = route(async (req, s, { params }) => {
  const key = mustKey(params.key);
  const id = mustId(params.id);
  const payload = buildWorklogPayload(await req.json(), "edit");
  await jira(s, `/rest/api/3/issue/${key}/worklog/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  return { id };
});

/** Delete a worklog. Jira enforces that you can only delete your own (unless you are an admin). */
export const DELETE = route(async (_req, s, { params }) => {
  const key = mustKey(params.key);
  const id = mustId(params.id);
  await jira(s, `/rest/api/3/issue/${key}/worklog/${id}`, { method: "DELETE" });
  return { ok: true };
});
