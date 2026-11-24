/** Money is always integer paise. 100 paise = 1 rupee. */
export const CURRENCY = 'INR';

/** Indian digit grouping: 1,24,999. */
function groupIndian(rupees: number): string {
  const digits = String(rupees);
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${digits.slice(-3)}`;
}

/** "₹249", "₹249.50", "₹1,24,999". Whole rupees drop the decimals. */
export function formatPaise(paise: number): string {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(Math.round(paise));
  const rest = abs % 100;
  return `${sign}₹${groupIndian(Math.floor(abs / 100))}${rest ? `.${String(rest).padStart(2, '0')}` : ''}`;
}

/** Parses "49", "49.5" or "₹49.50" into paise. Returns null for anything else. */
export function parseRupees(input: string): number | null {
  const match = /^\s*₹?\s*(\d{1,6})(?:\.(\d{1,2}))?\s*$/.exec(input);
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
}

/** Whole-number percentage off the printed price, or 0 when there is no saving. */
export function percentOff(mrpPaise: number, pricePaise: number): number {
  if (mrpPaise <= 0 || pricePaise >= mrpPaise) return 0;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
