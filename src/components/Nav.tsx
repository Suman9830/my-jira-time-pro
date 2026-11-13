"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { api, Me } from "@/lib/client";

export default function Nav({ me }: { me: Me | null }) {
  const path = usePathname();
  const link = (href: string, label: string) => (
    <Link href={href} className={path === href ? "active" : ""}>
      {label}
    </Link>
  );

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <nav className="nav">
      <span className="brand">Jira My Time Pro</span>
      {link("/", "Issues")}
      {link("/timesheet", "Timesheet")}
      {link("/settings", "Settings")}
      <span className="spacer" />
      {me && <span className="muted">{me.name}</span>}
      <button onClick={logout}>Sign out</button>
    </nav>
  );
}
