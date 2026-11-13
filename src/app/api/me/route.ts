import { route } from "@/lib/api";
import { env } from "@/lib/env";
import { getPrefs } from "@/lib/prefs";

export const dynamic = "force-dynamic";

export const GET = route(async (_req, s) => ({
  accountId: s.accountId,
  name: s.name,
  avatar: s.avatar,
  siteUrl: s.siteUrl,
  startDateField: Boolean(env("JIRA_START_DATE_FIELD", true)),
  prefs: await getPrefs(s.accountId),
}));
