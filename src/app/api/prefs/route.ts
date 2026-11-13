import { HttpError, PROJECT_RE, route } from "@/lib/api";
import { getPrefs, savePrefs } from "@/lib/prefs";

export const dynamic = "force-dynamic";

export const GET = route(async (_req, s) => getPrefs(s.accountId));

export const PUT = route(async (req, s) => {
  const b = await req.json();
  const defaultProject = b.defaultProject ? String(b.defaultProject) : null;
  if (defaultProject && !PROJECT_RE.test(defaultProject)) throw new HttpError(400, "Invalid project key");
  await savePrefs(s.accountId, { showTeam: Boolean(b.showTeam), defaultProject });
  return getPrefs(s.accountId);
});
