import { HttpError, mustKey, route } from "@/lib/api";
import { jira } from "@/lib/jira";

export const dynamic = "force-dynamic";

/** Statuses this issue can move to right now (depends on workflow and your permissions). */
export const GET = route(async (_req, s, { params }) => {
  const key = mustKey(params.key);
  const r = await jira(s, `/rest/api/3/issue/${key}/transitions`);
  return (r.transitions ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    to: t.to?.name ?? t.name,
    category: t.to?.statusCategory?.key ?? "",
  }));
});

/** Move the issue. Body: { transitionId } */
export const POST = route(async (req, s, { params }) => {
  const key = mustKey(params.key);
  const { transitionId } = await req.json();
  if (!/^\d+$/.test(String(transitionId ?? ""))) throw new HttpError(400, "Invalid transition");
  await jira(s, `/rest/api/3/issue/${key}/transitions`, {
    method: "POST",
    body: JSON.stringify({ transition: { id: String(transitionId) } }),
  });
  return { ok: true };
});
