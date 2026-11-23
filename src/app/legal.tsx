import type { ReactNode } from "react";

export const BASE_URL = "https://my-jira-time-pro.vercel.app";
export const SUPPORT_EMAIL = "sumandebnathoffice@gmail.com";
export const VENDOR = "MyJiraTimePro";
export const UPDATED = "November 23, 2026";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="wrap" style={{ maxWidth: 800, marginTop: 24, marginBottom: 48 }}>
      <div className="card" style={{ lineHeight: 1.6 }}>
        <p style={{ margin: 0 }}>
          <a href="/login">← Jira My Time Pro</a>
        </p>
        <h1>{title}</h1>
        <p className="muted">Last updated: {UPDATED}</p>
        {children}
        <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "24px 0" }} />
        <p className="muted">
          <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a> · <a href="/support">Support</a>
        </p>
      </div>
    </main>
  );
}
