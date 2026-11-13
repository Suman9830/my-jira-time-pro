"use client";

import { useEffect, useRef, useState } from "react";
import { api, IssueRow } from "@/lib/client";

const KEY_RE = /^[A-Za-z][A-Za-z0-9_]*-\d+$/;

interface Props {
  /** Called with the chosen issue key, or "" while nothing valid is chosen */
  onChange: (key: string) => void;
  autoFocus?: boolean;
}

/** Search issues by title, task id or bug id (key). Empty box lists your most recently updated issues. */
export default function IssuePicker({ onChange, autoFocus }: Props) {
  const [text, setText] = useState("");
  const [chosen, setChosen] = useState("");
  const [results, setResults] = useState<IssueRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [error, setError] = useState("");
  const reqId = useRef(0);

  useEffect(() => {
    if (!open || chosen) return; // do not search while showing a chosen issue
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const p = new URLSearchParams();
        if (text.trim()) p.set("q", text.trim());
        if (!mineOnly) p.set("assignee", "all");
        const r = await api<{ issues: IssueRow[] }>(`/api/issues?${p}`);
        if (id === reqId.current) setResults(r.issues);
      } catch (e) {
        if (id === reqId.current) setError((e as Error).message);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [text, open, mineOnly, chosen]);

  function pick(i: IssueRow) {
    setChosen(i.key);
    setText(`${i.key}  ${i.summary}`);
    setOpen(false);
    onChange(i.key);
  }

  function type(v: string) {
    setChosen("");
    setText(v);
    setOpen(true);
    // allow typing an exact key (ABC-123) without opening the list
    onChange(KEY_RE.test(v.trim()) ? v.trim().toUpperCase() : "");
  }

  return (
    <div className="picker">
      <input
        value={text}
        autoFocus={autoFocus}
        placeholder="Search by title or key, e.g. ABC-123 or 'login bug'"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => type(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && open && results[0] && !chosen) {
            e.preventDefault();
            pick(results[0]);
          }
        }}
      />
      {open && !chosen && (
        <div className="picker-list" onMouseDown={(e) => e.preventDefault()}>
          <label className="picker-opt" style={{ display: "flex", gap: 6, alignItems: "center", margin: 0 }}>
            <input type="checkbox" style={{ width: "auto" }} checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
            Only issues assigned to me
          </label>
          {loading && <div className="picker-opt muted">Searching...</div>}
          {error && <div className="picker-opt err">{error}</div>}
          {!loading && !error && !results.length && <div className="picker-opt muted">No issues found.</div>}
          {results.map((i) => (
            <div key={i.key} className="picker-opt pick" onClick={() => pick(i)}>
              <strong>{i.key}</strong> {i.summary}
              <div className="muted">
                {i.type} · {i.status}
                {i.assignee ? ` · ${i.assignee}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
