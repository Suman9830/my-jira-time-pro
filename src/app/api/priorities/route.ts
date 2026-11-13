import { route } from "@/lib/api";
import { jira } from "@/lib/jira";

export const dynamic = "force-dynamic";

export const GET = route(async (_req, s) => {
  const r = await jira(s, "/rest/api/3/priority");
  return (r as any[]).map((p) => p.name);
});
