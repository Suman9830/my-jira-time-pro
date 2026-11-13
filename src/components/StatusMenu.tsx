"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";

interface Transition {
  id: string;
  name: string;
  to: string;
  category: string;
}

interface Props {
  issueKey: string;
  status: string;
  category: string;
  onChanged: (status: string, category: string) => void;
}

/** Status chip; click to load the allowed transitions and move the issue. */
export default function StatusMenu({ issueKey, status, category, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [list, setList] = useState<Transition[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const btn = useRef<HTMLButtonElement>(null);

  // fixed-position menu would drift on scroll, so close it
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  async function toggle() {
    if (open) return setOpen(false);
    const r = btn.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 2, left: r.left });
    setOpen(true);
    setError("");
    setList(null);
    try {
      setList(await api<Transition[]>(`/api/issues/${issueKey}/transitions`));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function go(t: Transition) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/issues/${issueKey}/transitions`, { method: "POST", body: JSON.stringify({ transitionId: t.id }) });
      onChanged(t.to, t.category);
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        ref={btn}
        className={`chip chip-btn st-${category}`}
        onClick={toggle}
        onBlur={() => setOpen(false)}
        disabled={busy}
        title="Change status"
      >
        {status}
      </button>
      {open && (
        <div className="picker-list" style={{ position: "fixed", top: pos.top, left: pos.left, right: "auto", minWidth: 190 }} onMouseDown={(e) => e.preventDefault()}>
          {!list && !error && <div className="picker-opt muted">Loading...</div>}
          {error && <div className="picker-opt err">{error}</div>}
          {list && !list.length && <div className="picker-opt muted">No transitions available.</div>}
          {list?.map((t) => (
            <div key={t.id} className="picker-opt pick" onClick={() => go(t)}>
              <span className={`chip st-${t.category}`}>{t.to}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
