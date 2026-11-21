// Pure class-name helpers. No "use client" here, so server-rendered pages
// (like the landing page) can call them too.

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "accent" | "lime" | "outline" | "quiet" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BUTTON_BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-ink font-bold " +
  "transition-[transform,box-shadow] duration-100 focus-visible:outline-none focus-visible:ring-4 " +
  "focus-visible:ring-grape/40 disabled:pointer-events-none disabled:opacity-45";

const BUTTON_PRESS =
  "shadow-hard-sm hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: `bg-ink text-white ${BUTTON_PRESS}`,
  accent: `bg-tomato text-ink ${BUTTON_PRESS}`,
  lime: `bg-lime text-ink ${BUTTON_PRESS}`,
  outline: `bg-paper text-ink ${BUTTON_PRESS}`,
  danger: `bg-tomato-soft text-ink ${BUTTON_PRESS}`,
  quiet: "border-transparent bg-transparent text-ink hover:bg-ink/5",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[15px]",
  lg: "h-13 px-6 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string): string {
  return cx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], extra);
}
