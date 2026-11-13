import { toAdf } from "./adf";
import { DATE_RE, HttpError, KEY_RE, PROJECT_RE } from "./api";
import { env } from "./env";
import { Session } from "./session";

export interface IssueInput {
  projectKey?: string;
  issueTypeId?: string;
  parentKey?: string;
  summary?: string;
  description?: string;
  originalEstimate?: string;
  startDate?: string;
  dueDate?: string;
  priority?: string;
  labels?: string[];
  assignToMe?: boolean;
}

/** Build the Jira `fields` object from our simple form payload. */
export function buildFields(b: IssueInput, s: Session, mode: "create" | "edit") {
  const f: Record<string, unknown> = {};

  if (mode === "create") {
    if (!b.projectKey || !PROJECT_RE.test(b.projectKey)) throw new HttpError(400, "Project is required");
    if (!b.issueTypeId || !/^\d+$/.test(b.issueTypeId)) throw new HttpError(400, "Issue type is required");
    f.project = { key: b.projectKey };
    f.issuetype = { id: b.issueTypeId };
    if (b.parentKey) {
      if (!KEY_RE.test(b.parentKey)) throw new HttpError(400, "Invalid parent key");
      f.parent = { key: b.parentKey.toUpperCase() };
    }
    if (b.assignToMe) f.assignee = { accountId: s.accountId };
  }

  if (b.summary !== undefined) {
    if (!b.summary.trim()) throw new HttpError(400, "Title is required");
    f.summary = b.summary.trim();
  } else if (mode === "create") {
    throw new HttpError(400, "Title is required");
  }

  if (b.description !== undefined) f.description = b.description.trim() ? toAdf(b.description) : null;

  if (b.originalEstimate !== undefined) {
    const est = b.originalEstimate.trim();
    if (est && !/^(\d+[wdhm]\s*)+$/i.test(est)) throw new HttpError(400, "Estimate must look like 1h 30m, 2d or 1w");
    f.timetracking = est ? { originalEstimate: est } : {};
  }

  if (b.dueDate !== undefined) {
    if (b.dueDate && !DATE_RE.test(b.dueDate)) throw new HttpError(400, "Due date must be YYYY-MM-DD");
    f.duedate = b.dueDate || null;
  }

  if (b.startDate !== undefined) {
    const field = env("JIRA_START_DATE_FIELD", true);
    if (field) {
      if (b.startDate && !DATE_RE.test(b.startDate)) throw new HttpError(400, "Start date must be YYYY-MM-DD");
      f[field] = b.startDate || null;
    }
  }

  if (b.priority) f.priority = { name: b.priority };
  if (b.labels) f.labels = b.labels.map((l) => l.trim().replace(/\s+/g, "-")).filter(Boolean);

  return f;
}
