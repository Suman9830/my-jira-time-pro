"use client";

export async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Not signed in");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json as T;
}

export function fmtDuration(sec: number): string {
  if (!sec) return "0h";
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-10" (or an ISO timestamp) -> "10 Nov 2026" */
export function fmtDate(d: string | null | undefined): string {
  const m = d ? /^(\d{4})-(\d{2})-(\d{2})/.exec(d) : null;
  return m ? `${m[3]} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : d ?? "";
}

export interface Me {
  accountId: string;
  name: string;
  avatar: string | null;
  siteUrl: string;
  startDateField: boolean;
  prefs: { showTeam: boolean; defaultProject: string | null };
}

export interface Project {
  id: string;
  key: string;
  name: string;
}

export interface IssueRow {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  type: string;
  subtask: boolean;
  priority: string;
  assignee: string;
  project: string;
  parentKey: string | null;
  dueDate: string | null;
  estimateSec: number;
  spentSec: number;
}

export interface WorklogEntry {
  id: string;
  issueKey: string;
  summary: string;
  project: string;
  authorId: string;
  author: string;
  date: string;
  start: string; // HH:mm
  seconds: number;
  comment: string;
  mine: boolean;
}
