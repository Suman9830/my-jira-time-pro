import { HttpError, PROJECT_RE, route } from "@/lib/api";
import { jira } from "@/lib/jira";

export const dynamic = "force-dynamic";

/** Active + upcoming sprints of the scrum boards of a project. */
export const GET = route(async (req, s) => {
  const project = req.nextUrl.searchParams.get("project") ?? "";
  if (!PROJECT_RE.test(project)) throw new HttpError(400, "project is required");

  const boards = await jira(s, `/rest/agile/1.0/board?projectKeyOrId=${project}&type=scrum&maxResults=10`).catch(() => ({
    values: [],
  }));

  const seen = new Map<number, { id: number; name: string; state: string }>();
  await Promise.all(
    (boards.values ?? []).map(async (b: any) => {
      const r = await jira(s, `/rest/agile/1.0/board/${b.id}/sprint?state=active,future&maxResults=50`).catch(() => ({
        values: [],
      }));
      for (const sp of r.values ?? []) seen.set(sp.id, { id: sp.id, name: sp.name, state: sp.state });
    })
  );
  return [...seen.values()].sort((a, b) => (a.state === b.state ? b.id - a.id : a.state === "active" ? -1 : 1));
});
