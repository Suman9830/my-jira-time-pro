"use client";

import { useMemo, useState } from "react";
import { api, fmtDate, fmtDuration, WorklogEntry, ymd } from "@/lib/client";
import { formatMinutes, parseDuration } from "@/lib/duration";
import IssuePicker from "./IssuePicker";

interface Props {
  issueKey?: string;
  date?: string;
  /** Suggested start time, HH:mm */
  start?: string;
  /** When set, the form edits this worklog instead of creating one */
  edit?: WorklogEntry;
  onClose: () => void;
  onSaved: () => void;
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export default function WorklogForm({ issueKey = "", date, start: startProp, edit, onClose, onSaved }: Props) {
  const [key, setKey] = useState(edit?.issueKey ?? issueKey);
  const [day, setDay] = useState(edit?.date ?? (date || ymd(new Date())));
  const [start, setStart] = useState(edit?.start || startProp || "09:00");
  const [durText, setDurText] = useState(edit ? formatMinutes(Math.round(edit.seconds / 60)) : "1h");
  const [comment, setComment] = useState(edit?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const minutes = useMemo(() => parseDuration(durText), [durText]);

  // End time is derived from start + duration
  const endInfo = useMemo(() => {
    if (!minutes || !start) return null;
    const total = toMin(start) + minutes;
    return { time: hhmm(total % 1440), days: Math.floor(total / 1440) };
  }, [minutes, start]);

  /** Typing an end time (same day) rewrites the duration */
  function onEndChange(value: string) {
    if (!value || !start) return;
    const diff = toMin(value) - toMin(start);
    if (diff > 0) setDurText(formatMinutes(diff));
    else setError("End time must be after the start time. For longer logs, type a duration such as 1d.");
  }

  async function save() {
    if (!minutes) return;
    setSaving(true);
    setError("");
    try {
      const body = JSON.stringify({
        date: day,
        start,
        durationMin: minutes,
        tzOffsetMin: -new Date().getTimezoneOffset(),
        comment,
      });
      if (edit) await api(`/api/issues/${edit.issueKey}/worklog/${edit.id}`, { method: "PUT", body });
      else await api(`/api/issues/${key.trim()}/worklog`, { method: "POST", body });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  async function remove() {
    if (!edit) return;
    if (!confirm(`Delete this log (${fmtDuration(edit.seconds)} on ${edit.issueKey}, ${fmtDate(edit.date)} ${edit.start})?\nThis cannot be undone.`)) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/issues/${edit.issueKey}/worklog/${edit.id}`, { method: "DELETE" });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{edit ? `Edit log on ${edit.issueKey}` : "Log time"}</h3>
        <div className="field">
          <label>Issue (search by title, task id or bug id)</label>
          {issueKey || edit ? (
            <input value={key} disabled />
          ) : (
            <IssuePicker onChange={setKey} autoFocus />
          )}
        </div>
        <div className="grid2 field">
          <div>
            <label>Start date</label>
            <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
          </div>
          <div>
            <label>Start time</label>
            <input type="time" step={300} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
        </div>
        <div className="grid2 field">
          <div>
            <label>Duration (1h, 1.5h, 90m, 1d = 8h, 1w = 5d)</label>
            <input value={durText} onChange={(e) => { setDurText(e.target.value); setError(""); }} placeholder="1h 30m" autoFocus={Boolean(issueKey) || Boolean(edit)} />
          </div>
          <div>
            <label>End time (auto)</label>
            <input
              type="time"
              step={300}
              value={endInfo?.time ?? ""}
              onChange={(e) => onEndChange(e.target.value)}
              disabled={!endInfo}
            />
          </div>
        </div>
        <p className={minutes ? "muted" : "err"} style={{ marginTop: 0 }}>
          {minutes
            ? `= ${formatMinutes(minutes)}, ${start} to ${endInfo?.time}${endInfo && endInfo.days > 0 ? ` (+${endInfo.days} day${endInfo.days > 1 ? "s" : ""})` : ""}`
            : "Enter a duration like 1h, 1.5h, 45m, 1d or 1w."}
        </p>
        <div className="field">
          <label>Comment</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        {error && <p className="err">{error}</p>}
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            {edit && (
              <button className="danger" onClick={remove} disabled={saving}>
                Delete
              </button>
            )}
          </div>
          <div className="row">
            <button onClick={onClose}>Cancel</button>
            <button className="primary" onClick={save} disabled={saving || !key.trim() || !minutes}>
              {saving ? "Saving..." : edit ? "Save changes" : "Log time"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
