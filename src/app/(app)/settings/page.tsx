"use client";

import { useEffect, useState } from "react";
import { useMe } from "@/components/MeContext";
import { api, Project } from "@/lib/client";

export default function SettingsPage() {
  const { me, reload } = useMe();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showTeam, setShowTeam] = useState(false);
  const [defaultProject, setDefaultProject] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<Project[]>("/api/projects").then(setProjects).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (me) {
      setShowTeam(me.prefs.showTeam);
      setDefaultProject(me.prefs.defaultProject ?? "");
    }
  }, [me]);

  async function save() {
    setMsg("");
    setError("");
    try {
      await api("/api/prefs", { method: "PUT", body: JSON.stringify({ showTeam, defaultProject: defaultProject || null }) });
      await reload();
      setMsg("Saved");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h3 style={{ marginTop: 0 }}>Preferences</h3>
      <div className="field">
        <label>Default project (used as the starting filter)</label>
        <select value={defaultProject} onChange={(e) => setDefaultProject(e.target.value)}>
          <option value="">None</option>
          {projects.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name} ({p.key})
            </option>
          ))}
        </select>
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14, color: "inherit" }}>
        <input type="checkbox" style={{ width: "auto", marginTop: 3 }} checked={showTeam} onChange={(e) => setShowTeam(e.target.checked)} />
        <span>
          Show team timesheets
          <div className="muted">Adds a team view to the Timesheet page. You only see worklogs on issues your Jira account can access.</div>
        </span>
      </label>
      <div className="row" style={{ marginTop: 14 }}>
        <button className="primary" onClick={save}>
          Save
        </button>
        {msg && <span style={{ color: "var(--ok)" }}>{msg}</span>}
      </div>
      {error && <p className="err">{error}</p>}
    </div>
  );
}
