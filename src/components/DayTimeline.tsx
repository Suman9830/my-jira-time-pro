"use client";

import { useEffect, useMemo, useRef } from "react";
import { fmtDuration, WorklogEntry } from "@/lib/client";

const HOUR_PX = 44;
const TOTAL_PX = HOUR_PX * 24;
const MIN_BLOCK_PX = 18;

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

interface Block {
  e: WorklogEntry;
  startMin: number;
  endMin: number;
  lane: number;
  lanes: number;
}

/** Place overlapping entries side by side. */
function layout(entries: WorklogEntry[]): Block[] {
  const blocks = entries
    .map((e) => {
      const startMin = toMin(e.start);
      return { e, startMin, endMin: Math.min(startMin + Math.max(Math.round(e.seconds / 60), 1), 1440), lane: 0, lanes: 1 };
    })
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  // group into clusters of transitively overlapping blocks, then assign lanes inside each cluster
  let cluster: Block[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const laneEnds: number[] = [];
    for (const b of cluster) {
      let l = laneEnds.findIndex((end) => end <= b.startMin);
      if (l === -1) l = laneEnds.length;
      laneEnds[l] = b.endMin;
      b.lane = l;
    }
    for (const b of cluster) b.lanes = laneEnds.length;
    cluster = [];
  };
  for (const b of blocks) {
    if (cluster.length && b.startMin >= clusterEnd) flush();
    cluster.push(b);
    clusterEnd = Math.max(clusterEnd, b.endMin);
  }
  if (cluster.length) flush();
  return blocks;
}

interface Props {
  entries: WorklogEntry[];
  showAuthor: boolean;
  /** Called with a start time (HH:mm) when the empty timeline is clicked */
  onPick: (start: string) => void;
  /** Called when one of your own blocks is clicked */
  onEdit: (entry: WorklogEntry) => void;
}

export default function DayTimeline({ entries, showAuthor, onPick, onEdit }: Props) {
  const blocks = useMemo(() => layout(entries), [entries]);
  const scroller = useRef<HTMLDivElement>(null);

  // show the first entry (or 8am) at the top when the day changes
  useEffect(() => {
    const first = blocks.length ? Math.min(...blocks.map((b) => b.startMin)) : 8 * 60;
    if (scroller.current) scroller.current.scrollTop = Math.max((first / 60 - 1) * HOUR_PX, 0);
  }, [blocks]);

  function click(ev: React.MouseEvent<HTMLDivElement>) {
    if ((ev.target as HTMLElement).closest(".tl-block")) return;
    const y = ev.clientY - ev.currentTarget.getBoundingClientRect().top;
    const m = Math.min(Math.floor(((y / TOTAL_PX) * 1440) / 15) * 15, 1425);
    onPick(hhmm(m));
  }

  return (
    <div className="tl-scroll" ref={scroller}>
      <div className="tl" style={{ height: TOTAL_PX }} onClick={click}>
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="tl-hour" style={{ top: h * HOUR_PX, height: HOUR_PX }}>
            <span>{String(h).padStart(2, "0")}:00</span>
          </div>
        ))}
        <div className="tl-area">
          {blocks.map((b) => {
            const top = (b.startMin / 1440) * TOTAL_PX;
            const height = Math.max(((b.endMin - b.startMin) / 1440) * TOTAL_PX, MIN_BLOCK_PX);
            return (
              <div
                key={b.e.id}
                className={`tl-block ${b.e.mine ? "mine" : "other"}`}
                onClick={() => b.e.mine && onEdit(b.e)}
                title={`${b.e.issueKey} ${b.e.summary}\n${b.e.start}-${hhmm(b.endMin)} (${fmtDuration(b.e.seconds)})${
                  showAuthor ? `\n${b.e.author}` : ""
                }${b.e.comment ? `\n${b.e.comment}` : ""}`}
                style={{
                  top,
                  height,
                  left: `${(b.lane / b.lanes) * 100}%`,
                  width: `calc(${100 / b.lanes}% - 3px)`,
                }}
              >
                <strong>{b.e.issueKey}</strong> {b.e.start}-{hhmm(b.endMin)}
                {height > 34 && <div className="tl-sub">{showAuthor ? b.e.author : b.e.summary}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
