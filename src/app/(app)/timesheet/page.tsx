"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DayTimeline from "@/components/DayTimeline";
import WorklogForm from "@/components/WorklogForm";
import { useMe } from "@/components/MeContext";
import { api, fmtDate, fmtDuration, WorklogEntry, ymd } from "@/lib/client";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TimesheetPage() {
  const { me } = useMe();
  const today = ymd(new Date());
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [team, setTeam] = useState(false);
  const [entries, setEntries] = useState<WorklogEntry[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [selected, setSelected] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logging, setLogging] = useState(false);
  const [logStart, setLogStart] = useState<string | undefined>();
  const [editing, setEditing] = useState<WorklogEntry | null>(null);

  // Calendar grid (Monday first), including leading/trailing days of neighbouring months
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    const count = Math.ceil((offset + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) / 7) * 7;
    return Array.from({ length: count }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [month]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const from = ymd(days[0]);
      const to = ymd(days[days.length - 1]);
      const r = await api<{ entries: WorklogEntry[]; truncated: boolean }>(
        `/api/timesheet?from=${from}&to=${to}&scope=${team ? "team" : "me"}`
      );
      setEntries(r.entries);
      setTruncated(r.truncated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [days, team]);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => {
    const m = new Map<string, WorklogEntry[]>();
    for (const e of entries) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [entries]);

  const monthTotal = entries
    .filter((e) => e.date.startsWith(ymd(month).slice(0, 7)))
    .reduce((n, e) => n + e.seconds, 0);

  const dayEntries = byDay.get(selected) ?? [];

  // Default start for a new log: right after your last log of the day, otherwise 09:00
  function nextFreeStart(): string {
    const ends = dayEntries
      .filter((e) => e.mine)
      .map((e) => Number(e.start.slice(0, 2)) * 60 + Number(e.start.slice(3, 5)) + Math.round(e.seconds / 60));
    const m = ends.length ? Math.min(Math.max(...ends), 23 * 60) : 9 * 60;
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  }

  function openLog(start?: string) {
    setLogStart(start ?? nextFreeStart());
    setLogging(true);
  }

  async function remove(e: WorklogEntry) {
    if (!confirm(`Delete this log (${fmtDuration(e.seconds)} on ${e.issueKey}, ${fmtDate(e.date)} ${e.start})?\nThis cannot be undone.`)) return;
    try {
      await api(`/api/issues/${e.issueKey}/worklog/${e.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <>
      <div className="row" style={{ marginBottom: 10 }}>
        <button onClick={() => shift(-1)}>&lsaquo;</button>
        <strong style={{ minWidth: 150, textAlign: "center" }}>
          {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </strong>
        <button onClick={() => shift(1)}>&rsaquo;</button>
        <button onClick={() => { setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); setSelected(today); }}>Today</button>
        <span className="muted">Month total: {fmtDuration(monthTotal)}</span>
        <span style={{ flex: 1 }} />
        {me?.prefs.showTeam && (
          <select style={{ width: "auto" }} value={team ? "team" : "me"} onChange={(e) => setTeam(e.target.value === "team")}>
            <option value="me">My timesheet</option>
            <option value="team">Team timesheet</option>
          </select>
        )}
        <button className="primary" onClick={() => openLog()}>
          + Log time
        </button>
      </div>

      {error && <p className="err">{error}</p>}
      {truncated && <p className="muted">Showing the first 150 issues in this range. Pick a shorter range for complete data.</p>}

      <div className="cal">
        {DOW.map((d) => (
          <div key={d} className="dow">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const k = ymd(d);
          const list = byDay.get(k) ?? [];
          const total = list.reduce((n, e) => n + e.seconds, 0);
          const cls = ["day", d.getMonth() !== month.getMonth() ? "out" : "", k === selected ? "sel" : "", k === today ? "today" : ""];
          return (
            <div key={k} className={cls.join(" ")} onClick={() => setSelected(k)}>
              <div className="n">{d.getDate()}</div>
              {total > 0 && <div className="tot">{fmtDuration(total)}</div>}
            </div>
          );
        })}
      </div>
      {loading && <p className="muted">Loading...</p>}

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row" style={{ marginBottom: 6 }}>
          <strong>{fmtDate(selected)}</strong>
          <span className="muted">{fmtDuration(dayEntries.reduce((n, e) => n + e.seconds, 0))}</span>
        </div>
        <DayTimeline entries={dayEntries} showAuthor={team} onPick={openLog} onEdit={setEditing} />
        <p className="muted" style={{ margin: "0 0 8px" }}>
          Click an empty spot to log time from that hour. Click one of your blocks to edit or delete it.
        </p>
        {!dayEntries.length && <p className="muted">No time logged.</p>}
        {team ? (
          <TeamDay entries={dayEntries} onDelete={remove} onEdit={setEditing} />
        ) : (
          dayEntries.map((e) => <EntryLine key={e.id} e={e} onDelete={remove} onEdit={setEditing} />)
        )}
      </div>

      {editing && (
        <WorklogForm
          edit={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {logging && (
        <WorklogForm
          date={selected}
          start={logStart}
          onClose={() => setLogging(false)}
          onSaved={() => {
            setLogging(false);
            load();
          }}
        />
      )}
    </>
  );
}

interface LineActions {
  onDelete: (e: WorklogEntry) => void;
  onEdit: (e: WorklogEntry) => void;
}

function EntryLine({ e, onDelete, onEdit }: { e: WorklogEntry } & LineActions) {
  return (
    <div className="row" style={{ padding: "5px 0", borderTop: "1px solid var(--line)" }}>
      <span className="muted">{e.start}</span>
      <strong>{e.issueKey}</strong>
      <span className="grow">
        {e.summary}
        {e.comment && <div className="muted">{e.comment}</div>}
      </span>
      <span>{fmtDuration(e.seconds)}</span>
      {e.mine && (
        <>
          <button className="link" onClick={() => onEdit(e)}>
            Edit
          </button>
          <button className="link danger" onClick={() => onDelete(e)}>
            Delete
          </button>
        </>
      )}
    </div>
  );
}

function TeamDay({ entries, onDelete, onEdit }: { entries: WorklogEntry[] } & LineActions) {
  const groups = new Map<string, WorklogEntry[]>();
  for (const e of entries) groups.set(e.author, [...(groups.get(e.author) ?? []), e]);
  return (
    <>
      {[...groups.entries()].map(([author, list]) => (
        <div key={author} style={{ marginTop: 8 }}>
          <strong>{author}</strong>{" "}
          <span className="muted">{fmtDuration(list.reduce((n, e) => n + e.seconds, 0))}</span>
          {list.map((e) => (
            <EntryLine key={e.id} e={e} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </div>
      ))}
    </>
  );
}
