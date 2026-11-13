"use client";

import { useEffect, useState } from "react";
import { api, Project } from "@/lib/client";
import { formatMinutes, parseDuration } from "@/lib/duration";

export type FormMode =
  | { kind: "create" }
  | { kind: "edit"; key: string }
  | { kind: "subtask"; parentKey: string; projectKey: string };

interface IssueType {
  id: string;
  name: string;
  subtask: boolean;
}

interface Props {
  mode: FormMode;
  projects: Project[];
  defaultProject?: string;
  showStartDate: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function IssueForm({ mode, projects, defaultProject, showStartDate, onClose, onSaved }: Props) {
  const [projectKey, setProjectKey] = useState(
    mode.kind === "subtask" ? mode.projectKey : defaultProject || projects[0]?.key || ""
  );
  const [types, setTypes] = useState<IssueType[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [typeId, setTypeId] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [estimate, setEstimate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("");
  const [labels, setLabels] = useState("");
  const [assignToMe, setAssignToMe] = useState(true);
  const [loading, setLoading] = useState(mode.kind === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = mode.kind === "edit";

  useEffect(() => {
    api<string[]>("/api/priorities").then(setPriorities).catch(() => {});
  }, []);

  // Load the issue being edited
  useEffect(() => {
    if (mode.kind !== "edit") return;
    api(`/api/issues/${mode.key}`)
      .then((i) => {
        setProjectKey(i.projectKey);
        setSummary(i.summary);
        setDescription(i.description);
        setEstimate(i.estimateSec ? formatMinutes(Math.round(i.estimateSec / 60)) : "");
        setStartDate(i.startDate || "");
        setDueDate(i.dueDate || "");
        setPriority(i.priority);
        setLabels((i.labels || []).join(", "));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mode]);

  // Issue types of the chosen project (create / subtask only)
  useEffect(() => {
    if (isEdit || !projectKey) return;
    api<IssueType[]>(`/api/projects/${projectKey}/issuetypes`)
      .then((list) => {
        const usable = list.filter((t) => t.subtask === (mode.kind === "subtask"));
        setTypes(usable);
        setTypeId(usable[0]?.id ?? "");
      })
      .catch((e) => setError(e.message));
  }, [projectKey, isEdit, mode.kind]);

  async function save() {
    const estMinutes = estimate.trim() ? parseDuration(estimate) : null;
    if (estimate.trim() && !estMinutes) {
      setError("Estimate must look like 1h, 1.5h, 90m, 1d (8h) or 1w (5d).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const common = {
        summary,
        description,
        originalEstimate: estMinutes ? formatMinutes(estMinutes) : "",
        dueDate,
        priority: priority || undefined,
        labels: labels.split(",").map((l) => l.trim()).filter(Boolean),
        ...(showStartDate ? { startDate } : {}),
      };
      if (mode.kind === "edit") {
        await api(`/api/issues/${mode.key}`, { method: "PUT", body: JSON.stringify(common) });
      } else {
        await api("/api/issues", {
          method: "POST",
          body: JSON.stringify({
            ...common,
            projectKey,
            issueTypeId: typeId,
            assignToMe,
            ...(mode.kind === "subtask" ? { parentKey: mode.parentKey } : {}),
          }),
        });
      }
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  const title =
    mode.kind === "edit" ? `Edit ${mode.key}` : mode.kind === "subtask" ? `New subtask of ${mode.parentKey}` : "New issue";

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{title}</h3>
        {loading ? (
          <p className="muted">Loading...</p>
        ) : (
          <>
            {!isEdit && (
              <div className="grid2 field">
                <div>
                  <label>Project</label>
                  <select value={projectKey} disabled={mode.kind === "subtask"} onChange={(e) => setProjectKey(e.target.value)}>
                    {projects.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.name} ({p.key})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>{mode.kind === "subtask" ? "Subtask type" : "Issue type"}</label>
                  <select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className="field">
              <label>Title</label>
              <input value={summary} onChange={(e) => setSummary(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid2 field">
              <div>
                <label>Original estimate (1h, 1.5h, 1d = 8h, 1w = 5d)</label>
                <input value={estimate} onChange={(e) => setEstimate(e.target.value)} placeholder="1.5h" />
              </div>
              <div>
                <label>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="">Default</option>
                  {priorities.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid2 field">
              {showStartDate && (
                <div>
                  <label>Start date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
              )}
              <div>
                <label>Due date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Labels (comma separated)</label>
              <input value={labels} onChange={(e) => setLabels(e.target.value)} />
            </div>
            {!isEdit && (
              <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="checkbox" style={{ width: "auto" }} checked={assignToMe} onChange={(e) => setAssignToMe(e.target.checked)} />
                Assign to me
              </label>
            )}
          </>
        )}
        {error && <p className="err">{error}</p>}
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={save} disabled={saving || loading || !summary.trim()}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
