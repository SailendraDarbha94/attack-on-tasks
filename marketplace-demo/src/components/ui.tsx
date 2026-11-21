"use client";

import { Minus, Plus, X } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import type { Category, Tint } from "@/lib/types";
import { buttonClass, cx, type ButtonSize, type ButtonVariant } from "./classes";

export { buttonClass, cx };

// ── Buttons ───────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

// ── Surfaces ──────────────────────────────────────────────────────────────

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-2xl border-2 border-ink bg-paper shadow-hard", className)}>{children}</div>;
}

export const TINT_BG: Record<Tint, string> = {
  tomato: "bg-tomato",
  mint: "bg-mint",
  mango: "bg-mango",
  sky: "bg-sky",
  berry: "bg-berry",
  grape: "bg-grape",
  lime: "bg-lime",
};

export const TINT_SOFT: Record<Tint, string> = {
  tomato: "bg-tomato-soft",
  mint: "bg-mint-soft",
  mango: "bg-mango-soft",
  sky: "bg-sky-soft",
  berry: "bg-berry-soft",
  grape: "bg-grape-soft",
  lime: "bg-lime",
};

export const CATEGORY_TINT: Record<Category, Tint> = {
  "Fruits & Vegetables": "mint",
  "Dairy & Eggs": "sky",
  Staples: "mango",
  "Snacks & Drinks": "berry",
  Household: "grape",
};

export function Badge({ tint, className, children }: { tint?: Tint | "plain"; className?: string; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold text-ink",
        tint && tint !== "plain" ? TINT_SOFT[tint] : "bg-paper",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A product or store picture: an emoji on a colour tile. No photos to license. */
export function EmojiTile({ emoji, tint, className }: { emoji: string; tint: Tint; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        "grid shrink-0 place-items-center rounded-xl border-2 border-ink leading-none",
        TINT_SOFT[tint],
        className ?? "size-12 text-2xl",
      )}
    >
      {emoji}
    </span>
  );
}

export function EmptyState({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/30 bg-paper/60 px-6 py-10 text-center">
      <div aria-hidden className="text-4xl">
        {emoji}
      </div>
      <p className="mt-3 font-display text-xl font-extrabold">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{children}</div> : null}
    </div>
  );
}

// ── Forms ─────────────────────────────────────────────────────────────────

const CONTROL =
  "h-11 w-full rounded-xl border-2 border-ink bg-paper px-3 text-[15px] text-ink placeholder:text-ink-soft/60 " +
  "focus:outline-none focus:ring-4 focus:ring-grape/30";

interface FieldShellProps {
  label: string;
  hint?: string;
  className?: string;
}

function FieldShell({ label, hint, className, id, children }: FieldShellProps & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}

export function Field({ label, hint, className, ...props }: FieldShellProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} className={className} id={id}>
      <input id={id} className={CONTROL} {...props} />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  className,
  children,
  ...props
}: FieldShellProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} className={className} id={id}>
      <select id={id} className={CONTROL} {...props}>
        {children}
      </select>
    </FieldShell>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl border-2 border-ink bg-tomato-soft px-3 py-2 text-sm font-semibold">
      {children}
    </p>
  );
}

// ── Quantity stepper ──────────────────────────────────────────────────────

export function QtyStepper({
  qty,
  max,
  onChange,
  label,
}: {
  qty: number;
  max: number;
  onChange: (qty: number) => void;
  label: string;
}) {
  if (qty <= 0) {
    return (
      <Button variant="lime" size="sm" disabled={max <= 0} onClick={() => onChange(1)} aria-label={`Add ${label}`}>
        <Plus className="size-4" strokeWidth={3} />
        Add
      </Button>
    );
  }
  return (
    <div className="inline-flex h-9 items-center rounded-xl border-2 border-ink bg-lime shadow-hard-sm">
      <button
        type="button"
        className="grid h-full w-9 place-items-center rounded-l-[10px] hover:bg-ink/10"
        onClick={() => onChange(qty - 1)}
        aria-label={`Remove one ${label}`}
      >
        <Minus className="size-4" strokeWidth={3} />
      </button>
      <span className="min-w-6 text-center text-sm font-extrabold tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        className="grid h-full w-9 place-items-center rounded-r-[10px] hover:bg-ink/10 disabled:opacity-35"
        onClick={() => onChange(qty + 1)}
        disabled={qty >= max}
        aria-label={`Add one more ${label}`}
      >
        <Plus className="size-4" strokeWidth={3} />
      </button>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Next keeps the page you navigate away from mounted but hidden. A modal left
  // open there would still block every click on the new page, so close it on
  // the way out. Closing fires onClose, which resets the owner's state too.
  useLayoutEffect(() => {
    const dialog = ref.current;
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(92vw,34rem)] rounded-3xl border-2 border-ink bg-cream p-0 text-ink shadow-hard-lg backdrop:bg-ink/60"
    >
      {open ? (
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="font-display text-2xl font-extrabold leading-tight">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-paper hover:bg-ink/5"
            >
              <X className="size-4" strokeWidth={3} />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

// ── Page furniture ────────────────────────────────────────────────────────

export function PageTitle({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h1>
        {children ? <p className="mt-1 max-w-2xl text-ink-soft">{children}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-2xl border-2 border-ink bg-paper p-1">
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cx(
              "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-bold",
              selected ? "bg-ink text-white" : "text-ink hover:bg-ink/5",
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={cx(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  selected ? "bg-lime text-ink" : "bg-ink/10 text-ink",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
