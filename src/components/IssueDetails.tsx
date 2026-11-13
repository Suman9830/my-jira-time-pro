"use client";

import { useCallback, useEffect, useState } from "react";
import { api, fmtDate, fmtDuration, WorklogEntry } from "@/lib/client";
import { formatMinutes, parseDuration } from "@/lib/duration";
import StatusMenu from "./StatusMenu";
import WorklogForm from "./WorklogForm";

interface Detail {
  key: string;
  summary: string;
  description: string;
  issueType: string;
  status: string;
  statusCategory: string;
  priority: string;
  dueDate: string;
  estimateSec: number;
  spentSec: number;
  remainingSec: number;
  projectKey: string;
}

type Log = Omit<WorklogEntry, "summary" | "project">;

const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const endOf = (start: string, seconds: number) => hhmm(Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5)) + Math.round(seconds / 60));

interface Props {
  issueKey: string;
  siteUrl: string;
  onClose: () => void;
  /** Called after anything changed so the list can refresh */
  onChanged: () => void;
}

export default function IssueDetails({ issueKey, siteUrl, onClose, onChanged }: Props) {
  const [issue, setIssue] = useState<Detail | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState("");
  const [logging, setLogging] = useState(false);
  const [editingLog, setEditingLog] = useState<WorklogEntry | null>(null);

  const [estEdit, setEstEdit] = useState(false);
  const [estText, setEstText] = useState("");
  const [estSaving, setEstSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [i, l] = await Promise.all([api<Detail>(`/api/issues/${issueKey}`), api<Log[]>(`/api/issues/${issueKey}/worklog`)]);
      setIssue(i);
      setLogs(l);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [issueKey]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    load();
    onChanged();
  };

  const estMinutes = parseDuration(estText);

  async function saveEstimate() {
    if (!estMinutes && estText.trim()) return;
    setEstSaving(true);
    setError("");
    try {
      await api(`/api/issues/${issueKey}`, {
        method: "PUT",
        body: JSON.stringify({ originalEstimate: estMinutes ? formatMinutes(estMinutes) : "" }),
      });
      setEstEdit(false);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEstSaving(false);
    }
  }

  const totalLogged = logs.reduce((n, l) => n + l.seconds, 0);

  // shape expected by the worklog edit form
  const asEntry = (l: Log): WorklogEntry => ({ ...l, summary: issue?.summary ?? "", project: issue?.projectKey ?? "" });

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 780 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <h3 style={{ margin: 0 }}>
            <a href={`${siteUrl}/browse/${issueKey}`} target="_blank" rel="noreferrer">
              {issueKey}
            </a>{" "}
            {issue?.summary}
          </h3>
          <button onClick={onClose}>Close</button>
        </div>

        {error && <p className="err">{error}</p>}
        {!issue && !error && <p className="muted">Loading...</p>}

        {issue && (
          <>
            <div className="row" style={{ margin: "10px 0" }}>
              <StatusMenu
                issueKey={issueKey}
                status={issue.status}
                category={issue.statusCategory}
                onChanged={(status, statusCategory) => {
                  setIssue({ ...issue, status, statusCategory });
                  onChanged();
                }}
              />
              <span className="muted">
                {issue.issueType}
                {issue.priority ? ` · ${issue.priority}` : ""}
                {issue.dueDate ? ` · Due ${fmtDate(issue.dueDate)}` : ""}
              </span>
            </div>

            {issue.description && <p style={{ whiteSpace: "pre-wrap", margin: "0 0 12px" }}>{issue.description}</p>}

            <div className="card" style={{ marginBottom: 12 }}>
              <div className="row">
                <div>
                  <div className="muted">Original estimate</div>
                  {estEdit ? (
                    <div className="row">
                      <input
                        style={{ width: 130 }}
                        value={estText}
                        autoFocus
                        placeholder="1h, 1.5h, 1d, 1w"
                        onChange={(e) => setEstText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEstimate()}
                      />
                      <button className="primary" onClick={saveEstimate} disabled={estSaving || (!estMinutes && Boolean(estText.trim()))}>
                        Save
                      </button>
                      <button onClick={() => setEstEdit(false)}>Cancel</button>
                    </div>
                  ) : (
                    <strong>
                      {issue.estimateSec ? fmtDuration(issue.estimateSec) : "Not set"}{" "}
                      <button
                        className="link"
                        onClick={() => {
                          setEstText(issue.estimateSec ? formatMinutes(Math.round(issue.estimateSec / 60)) : "");
                          setEstEdit(true);
                        }}
                      >
                        Edit
                      </button>
                    </strong>
                  )}
                  {estEdit && (
                    <div className={estMinutes || !estText.trim() ? "muted" : "err"}>
                      {estMinutes ? `= ${formatMinutes(estMinutes)}` : estText.trim() ? "Use 1h, 1.5h, 90m, 1d (8h) or 1w (5d)" : "Empty clears the estimate"}
                    </div>
                  )}
                </div>
                <div>
                  <div className="muted">Time spent</div>
                  <strong>{fmtDuration(issue.spentSec)}</strong>
                </div>
                <div>
                  <div className="muted">Remaining</div>
                  <strong>{issue.remainingSec ? fmtDuration(issue.remainingSec) : "0h"}</strong>
                </div>
              </div>
            </div>

            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <strong>
                Time logs <span className="muted">({logs.length} · {fmtDuration(totalLogged)})</span>
              </strong>
              <button className="primary" onClick={() => setLogging(true)}>
                + Log time
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Duration</th>
                    <th>By</th>
                    <th>Comment</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{fmtDate(l.date)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {l.start}-{endOf(l.start, l.seconds)}
                      </td>
                      <td>{fmtDuration(l.seconds)}</td>
                      <td>{l.author}</td>
                      <td className="muted">{l.comment}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {l.mine && (
                          <button className="link" onClick={() => setEditingLog(asEntry(l))}>
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!logs.length && (
                    <tr>
                      <td colSpan={6} className="muted">
                        No time logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {logging && (
        <WorklogForm
          issueKey={issueKey}
          onClose={() => setLogging(false)}
          onSaved={() => {
            setLogging(false);
            refresh();
          }}
        />
      )}
      {editingLog && (
        <WorklogForm
          edit={editingLog}
          onClose={() => setEditingLog(null)}
          onSaved={() => {
            setEditingLog(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
