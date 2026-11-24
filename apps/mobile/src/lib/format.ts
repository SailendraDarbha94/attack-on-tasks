const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "8:05 pm", in the phone's own time zone. */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  const hours = date.getHours();
  return `${hours % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')} ${hours < 12 ? 'am' : 'pm'}`;
}

/** "Today", "Yesterday" or "12 Nov". */
export function formatDay(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((midnight(now) - midnight(date)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "Today, 8:05 pm". */
export function formatWhen(iso: string): string {
  return `${formatDay(iso)}, ${formatTime(iso)}`;
}

/** "1 item" / "3 items". */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}
