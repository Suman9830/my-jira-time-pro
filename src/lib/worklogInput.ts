import { toAdf } from "./adf";
import { DATE_RE, HttpError } from "./api";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_MINUTES = 100 * 60;

/**
 * Validate { date, start, durationMin, tzOffsetMin, comment } and build the Jira worklog payload.
 * tzOffsetMin is the browser's offset from UTC in minutes (e.g. +330 for IST).
 */
export function buildWorklogPayload(b: any, mode: "create" | "edit"): Record<string, unknown> {
  if (!DATE_RE.test(b.date ?? "")) throw new HttpError(400, "Date must be YYYY-MM-DD");
  if (!TIME_RE.test(b.start ?? "")) throw new HttpError(400, "Start must be HH:mm");

  const minutes = Number(b.durationMin);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_MINUTES) {
    throw new HttpError(400, "Duration must be between 1 minute and 100 hours");
  }

  const off = Number(b.tzOffsetMin);
  if (!Number.isInteger(off) || off < -840 || off > 840) throw new HttpError(400, "Invalid time zone offset");
  const abs = Math.abs(off);
  const tz = `${off >= 0 ? "+" : "-"}${String(Math.floor(abs / 60)).padStart(2, "0")}${String(abs % 60).padStart(2, "0")}`;

  const payload: Record<string, unknown> = {
    timeSpentSeconds: minutes * 60,
    started: `${b.date}T${b.start}:00.000${tz}`,
  };

  const comment = String(b.comment ?? "").trim();
  if (comment) payload.comment = toAdf(comment);
  // editing with an empty box means "clear the comment"
  else if (mode === "edit") payload.comment = { type: "doc", version: 1, content: [{ type: "paragraph", content: [] }] };

  return payload;
}
