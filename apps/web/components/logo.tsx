import { SITE } from "@/lib/site";

/** The mark: a lowercase "n" drawn as one arch, with a dot for the street corner the name means. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" aria-hidden="true">
      <rect width="1024" height="1024" rx="232" fill="#E8472B" />
      <path d="M 352 716 V 500 a 160 160 0 0 1 320 0 V 716" fill="none" stroke="#fff" strokeWidth="116" strokeLinecap="round" />
      <circle cx="730" cy="296" r="50" fill="#FFC83D" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-2xl font-extrabold tracking-tight">{SITE.name.toLowerCase()}</span>
    </span>
  );
}
