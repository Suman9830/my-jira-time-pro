import { route } from "@/lib/api";
import { jira } from "@/lib/jira";

export const dynamic = "force-dynamic";

export const GET = route(async (_req, s) => {
  const r = await jira(s, "/rest/api/3/project/search?maxResults=200&orderBy=name");
  return (r.values ?? []).map((p: any) => ({ id: p.id, key: p.key, name: p.name }));
});
