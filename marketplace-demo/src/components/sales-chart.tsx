"use client";

import { useEffect, useRef, useState } from "react";
import { inr, inrCompact } from "@/lib/format";
import { cx } from "./ui";

export interface DayPoint {
  ts: number;
  /** Short axis label, such as "Tue" or "Today". */
  label: string;
  /** Full label for the tooltip and table, such as "Tue, 17 Nov". */
  full: string;
  value: number;
  orders: number;
}

const HEIGHT = 232;
const MARGIN = { top: 26, right: 12, bottom: 30, left: 52 };
const MAX_BAR = 24;

function niceStep(rough: number): number {
  if (rough <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(rough));
  const unit = [1, 2, 2.5, 5, 10].find((m) => m * power >= rough) ?? 10;
  return unit * power;
}

/** A column with a 4px rounded top and a square foot on the baseline. */
function columnPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(4, height, width / 2);
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`;
}

/**
 * Sales per day for the last week. One series, so one colour and no legend:
 * the card title says what is plotted. Every value is reachable without
 * hovering through the table view.
 */
export function SalesChart({ days }: { days: DayPoint[] }) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [view, setView] = useState<"chart" | "table">("chart");
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const peak = Math.max(...days.map((d) => d.value), 0);
  const step = niceStep(peak / 3);
  const top = Math.max(step, Math.ceil(peak / step) * step);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const tickLabel = (value: number) => (top >= 10_000 ? inrCompact(value) : inr(value));

  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const band = days.length > 0 ? plotWidth / days.length : 0;
  const barWidth = Math.min(MAX_BAR, band * 0.5);
  const y = (value: number) => MARGIN.top + plotHeight - (value / top) * plotHeight;
  const centre = (index: number) => MARGIN.left + band * index + band / 2;
  const focused = active !== null ? days[active] : null;

  return (
    <div>
      {peak > 0 ? (
        <div className="mb-3 flex justify-end">
          <div className="inline-flex rounded-xl border-2 border-ink/15 p-0.5" role="group" aria-label="Show sales as">
            {(["chart", "table"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={cx(
                  "h-7 rounded-lg px-2.5 text-xs font-bold capitalize",
                  view === option ? "bg-ink text-white" : "text-ink-soft hover:text-ink",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div ref={frame} className="relative">
        {peak === 0 ? (
          <p className="grid place-items-center text-center text-sm text-ink-soft" style={{ height: HEIGHT }}>
            No sales in the last 7 days yet. Your first orders will be charted here.
          </p>
        ) : view === "table" ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-ink/15 text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="py-2 font-bold">Day</th>
                <th className="py-2 text-right font-bold">Orders</th>
                <th className="py-2 text-right font-bold">Sales</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.ts} className="border-b border-ink/10 last:border-0">
                  <td className="py-2">{day.full}</td>
                  <td className="py-2 text-right tabular-nums">{day.orders}</td>
                  <td className="py-2 text-right font-bold tabular-nums">{inr(day.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : width > 0 ? (
          <>
            <svg width={width} height={HEIGHT} role="group" aria-label="Sales for each of the last 7 days">
              {ticks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={MARGIN.left}
                    x2={width - MARGIN.right}
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke={tick === 0 ? "var(--color-ink)" : "var(--color-line)"}
                    strokeOpacity={tick === 0 ? 0.35 : 1}
                    strokeWidth={1}
                  />
                  <text
                    x={MARGIN.left - 8}
                    y={y(tick)}
                    dy="0.32em"
                    textAnchor="end"
                    className="fill-ink-soft text-[11px] tabular-nums"
                  >
                    {tickLabel(tick)}
                  </text>
                </g>
              ))}

              {days.map((day, index) => {
                const isLast = index === days.length - 1;
                const height = (day.value / top) * plotHeight;
                return (
                  <g key={day.ts}>
                    {height > 0 ? (
                      <path
                        d={columnPath(centre(index) - barWidth / 2, y(day.value), barWidth, height)}
                        fill="var(--color-grape)"
                        fillOpacity={active === null || active === index ? 1 : 0.55}
                      />
                    ) : null}
                    {/* Only the latest day is labelled on the mark; the axis, tooltip and table carry the rest. */}
                    {isLast && day.value > 0 ? (
                      <text
                        x={centre(index)}
                        y={y(day.value) - 7}
                        textAnchor="middle"
                        className="fill-ink text-[12px] font-bold"
                      >
                        {inr(day.value)}
                      </text>
                    ) : null}
                    <text
                      x={centre(index)}
                      y={HEIGHT - 9}
                      textAnchor="middle"
                      className={cx("text-[12px]", isLast ? "fill-ink font-bold" : "fill-ink-soft")}
                    >
                      {day.label}
                    </text>
                    {/* The whole column band is the hover and focus target, not just the bar. */}
                    <rect
                      x={MARGIN.left + band * index}
                      y={MARGIN.top - 12}
                      width={band}
                      height={plotHeight + 12 + MARGIN.bottom}
                      fill="transparent"
                      tabIndex={0}
                      role="img"
                      aria-label={`${day.full}: ${inr(day.value)} from ${day.orders} ${day.orders === 1 ? "order" : "orders"}`}
                      className="outline-none focus-visible:stroke-grape focus-visible:stroke-2"
                      onPointerEnter={() => setActive(index)}
                      onPointerLeave={() => setActive((current) => (current === index ? null : current))}
                      onFocus={() => setActive(index)}
                      onBlur={() => setActive((current) => (current === index ? null : current))}
                    />
                  </g>
                );
              })}
            </svg>

            {focused && active !== null ? (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl border-2 border-ink bg-paper px-3 py-1.5 shadow-hard-sm"
                style={{
                  left: Math.min(Math.max(centre(active), 76), Math.max(76, width - 76)),
                  top: y(focused.value) - (active === days.length - 1 && focused.value > 0 ? 26 : 8),
                }}
              >
                <p className="text-sm font-extrabold leading-tight">{inr(focused.value)}</p>
                <p className="text-xs text-ink-soft">
                  {focused.full} · {focused.orders} {focused.orders === 1 ? "order" : "orders"}
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <div style={{ height: HEIGHT }} />
        )}
      </div>
    </div>
  );
}
