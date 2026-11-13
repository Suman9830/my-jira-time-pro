// Duration parsing for the time-log form.
// Units: m = minute, h = hour, d = 8 hours, w = 5 days (40 hours). Decimals allowed: 1.5h = 1h 30m.

const UNIT_MIN: Record<string, number> = { m: 1, h: 60, d: 8 * 60, w: 5 * 8 * 60 };

/** "1h", "1.5h", "2d", "1w", "1h 30m", "90m", or a bare number (hours). Returns whole minutes, or null if invalid. */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;

  if (/^\d+(\.\d+)?$/.test(s)) return finish(Number(s) * 60); // bare number = hours

  const re = /(\d+(?:\.\d+)?)\s*([wdhm])/g;
  let total = 0;
  let consumed = 0;
  for (const m of s.matchAll(re)) {
    total += Number(m[1]) * UNIT_MIN[m[2]];
    consumed += m[0].length;
  }
  // everything except spaces/commas must have been part of a "<number><unit>" token
  if (consumed !== s.replace(/[\s,]/g, "").length) return null;
  return finish(total);
}

function finish(minutes: number): number | null {
  const m = Math.round(minutes);
  return m >= 1 && m <= 100 * 60 ? m : null;
}

/** 90 -> "1h 30m", 480 -> "8h", 45 -> "45m" */
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ") || "0m";
}
