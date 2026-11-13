"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import IssueForm, { FormMode } from "@/components/IssueForm";
import IssueDetails from "@/components/IssueDetails";
import StatusMenu from "@/components/StatusMenu";
import WorklogForm from "@/components/WorklogForm";
import { useMe } from "@/components/MeContext";
import { api, fmtDate, fmtDuration, IssueRow, Project } from "@/lib/client";

interface Sprint {
  id: number;
  name: string;
  state: string;
}

export default function IssuesPage() {
  const { me } = useMe();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [q, setQ] = useState("");
  const [project, setProject] = useState("");
  const [sprint, setSprint] = useState("");
  const [mine, setMine] = useState(true);
  const [dateField, setDateField] = useState("updated");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormMode | null>(null);
  const [logFor, setLogFor] = useState<string | null>(null);
  const [detailsFor, setDetailsFor] = useState<string | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    api<Project[]>("/api/projects").then(setProjects).catch((e) => setError(e.message));
  }, []);

  // apply the saved default project once
  const appliedDefault = useRef(false);
  useEffect(() => {
    if (me && !appliedDefault.current) {
      appliedDefault.current = true;
      if (me.prefs.defaultProject) setProject(me.prefs.defaultProject);
    }
  }, [me]);

  useEffect(() => {
    setSprint("");
    setSprints([]);
    if (!project) return;
    api<Sprint[]>(`/api/sprints?project=${project}`).then(setSprints).catch(() => {});
  }, [project]);

  const load = useCallback(
    async (token: string | null) => {
      const id = ++reqId.current;
      setLoading(true);
      setError("");
      try {
        const p = new URLSearchParams();
        if (q.trim()) p.set("q", q.trim());
        if (project) p.set("project", project);
        if (sprint) p.set("sprint", sprint);
        if (!mine) p.set("assignee", "all");
        if (from) p.set("from", from);
        if (to) p.set("to", to);
        if (from || to) p.set("dateField", dateField);
        if (token) p.set("nextPageToken", token);
        const r = await api<{ issues: IssueRow[]; nextPageToken: string | null }>(`/api/issues?${p}`);
        if (id !== reqId.current) return; // a newer request replaced this one
        setIssues((prev) => (token ? [...prev, ...r.issues] : r.issues));
        setNext(r.nextPageToken);
      } catch (e) {
        if (id === reqId.current) setError((e as Error).message);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [q, project, sprint, mine, from, to, dateField]
  );

  // debounce filters so typing is not one request per keystroke
  useEffect(() => {
    const t = setTimeout(() => load(null), 350);
    return () => clearTimeout(t);
  }, [load]);

  const ids = me ? me.siteUrl : "";

  return (
    <>
      <div className="card">
        <div className="row">
          <div className="grow">
            <label>Search (text or key)</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search issues..." />
          </div>
          <div className="grow">
            <label>Project</label>
            <select value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grow">
            <label>Sprint</label>
            <select value={sprint} onChange={(e) => setSprint(e.target.value)}>
              <option value="">Any sprint</option>
              <option value="open">All open sprints</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.state})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <div>
            <label>Date field</label>
            <select value={dateField} onChange={(e) => setDateField(e.target.value)}>
              <option value="updated">Updated</option>
              <option value="created">Created</option>
              <option value="duedate">Due date</option>
            </select>
          </div>
          <div>
            <label>From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label>To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <label style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 16 }}>
            <input type="checkbox" style={{ width: "auto" }} checked={mine} onChange={(e) => setMine(e.target.checked)} />
            Assigned to me
          </label>
          <span style={{ flex: 1 }} />
          <button className="primary" style={{ marginTop: 16 }} onClick={() => setForm({ kind: "create" })}>
            + New issue
          </button>
        </div>
      </div>

      {error && <p className="err">{error}</p>}

      <div className="card" style={{ marginTop: 12, padding: 0, overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th style={{ paddingLeft: 12 }}>Issue</th>
              <th>Status</th>
              <th className="hide-sm">Priority</th>
              <th className="hide-sm">Est / Spent</th>
              <th className="hide-sm">Due</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {issues.map((i) => (
              <tr key={i.key}>
                <td style={{ paddingLeft: 12 }} className={i.subtask ? "sub" : ""}>
                  <button className="link" style={{ padding: 0, fontWeight: 600 }} onClick={() => setDetailsFor(i.key)} title="Open details and time logs">
                    {i.key}
                  </button>{" "}
                  {i.summary}{" "}
                  <a href={`${ids}/browse/${i.key}`} target="_blank" rel="noreferrer" title="Open in Jira">
                    &#8599;
                  </a>
                  <div className="muted">
                    {i.type}
                    {i.assignee ? ` · ${i.assignee}` : ""}
                    {i.parentKey ? ` · ${i.parentKey}` : ""}
                  </div>
                  <div className="muted show-sm">
                    {[i.priority, `${fmtDuration(i.estimateSec)} / ${fmtDuration(i.spentSec)}`, i.dueDate ? `Due ${fmtDate(i.dueDate)}` : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </td>
                <td>
                  <StatusMenu
                    issueKey={i.key}
                    status={i.status}
                    category={i.statusCategory}
                    onChanged={(status, statusCategory) =>
                      setIssues((prev) => prev.map((x) => (x.key === i.key ? { ...x, status, statusCategory } : x)))
                    }
                  />
                </td>
                <td className="hide-sm">{i.priority}</td>
                <td className="hide-sm">
                  {fmtDuration(i.estimateSec)} / {fmtDuration(i.spentSec)}
                </td>
                <td className="hide-sm" style={{ whiteSpace: "nowrap" }}>{fmtDate(i.dueDate)}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="link" onClick={() => setLogFor(i.key)}>
                    Log
                  </button>
                  <button className="link" onClick={() => setForm({ kind: "edit", key: i.key })}>
                    Edit
                  </button>
                  {!i.subtask && (
                    <button className="link" onClick={() => setForm({ kind: "subtask", parentKey: i.key, projectKey: i.project })}>
                      + Sub
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!issues.length && !loading && (
              <tr>
                <td colSpan={6} className="muted" style={{ padding: 16 }}>
                  No issues match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="row" style={{ justifyContent: "center", margin: 12 }}>
        {loading && <span className="muted">Loading...</span>}
        {!loading && next && <button onClick={() => load(next)}>Load more</button>}
      </div>

      {form && (
        <IssueForm
          mode={form}
          projects={projects}
          defaultProject={project || me?.prefs.defaultProject || undefined}
          showStartDate={Boolean(me?.startDateField)}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            load(null);
          }}
        />
      )}
      {detailsFor && (
        <IssueDetails
          issueKey={detailsFor}
          siteUrl={ids}
          onClose={() => setDetailsFor(null)}
          onChanged={() => load(null)}
        />
      )}
      {logFor && (
        <WorklogForm
          issueKey={logFor}
          onClose={() => setLogFor(null)}
          onSaved={() => {
            setLogFor(null);
            load(null);
          }}
        />
      )}
    </>
  );
}
