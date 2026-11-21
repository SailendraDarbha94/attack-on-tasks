export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** Rupees with Indian digit grouping: 123456 -> ₹1,23,456. */
export function inr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Compact rupees for chart axes and tiles: 12500 -> ₹12.5K. */
export function inrCompact(amount: number): string {
  if (amount >= 100_000) return `₹${trim(amount / 100_000)}L`;
  if (amount >= 1_000) return `₹${trim(amount / 1_000)}K`;
  return `₹${Math.round(amount)}`;
}

function trim(n: number): string {
  return n >= 10 ? String(Math.round(n)) : n.toFixed(1).replace(/\.0$/, "");
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function timeAgo(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} hr ago`;
  const days = Math.floor(diff / DAY);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export function clock(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function dayLabel(ts: number, now: number): string {
  const days = Math.round((startOfDay(now) - startOfDay(ts)) / DAY);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days === -1) return "Tomorrow";
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** For use mid-sentence: "today" or "yesterday", but "18 Nov" keeps its capital. */
export function dayLabelInline(ts: number, now: number): string {
  const label = dayLabel(ts, now);
  return /^\d/.test(label) ? label : label.toLowerCase();
}

export function dateTimeInline(ts: number, now: number): string {
  return `${dayLabelInline(ts, now)}, ${clock(ts)}`;
}

export function dateTime(ts: number, now: number): string {
  return `${dayLabel(ts, now)}, ${clock(ts)}`;
}

export function weekday(ts: number): string {
  return new Date(ts).toLocaleDateString("en-IN", { weekday: "short" });
}

export function addressLine(a: { line1: string; line2: string; area: string; city: string; pincode: string }): string {
  return [a.line1, a.line2, a.area, `${a.city} ${a.pincode}`].filter(Boolean).join(", ");
}
