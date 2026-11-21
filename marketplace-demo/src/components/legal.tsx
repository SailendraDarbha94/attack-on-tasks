import Link from "next/link";
import { TriangleAlert } from "lucide-react";

/** A paragraph, or a list of bullet points. */
export type LegalBlock = string | string[];

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

// The date the placeholder text was last edited. A fixed string, so the pages
// stay fully static.
export const LEGAL_UPDATED = "21 November 2026";

export function LegalLinks({ onDark = false }: { onDark?: boolean }) {
  const tone = onDark ? "text-white/70 hover:text-white" : "text-ink-soft hover:text-ink";
  return (
    <span className="inline-flex items-center gap-4 text-sm font-semibold">
      <Link href="/terms" className={`underline-offset-4 hover:underline ${tone}`}>
        Terms of Service
      </Link>
      <Link href="/privacy" className={`underline-offset-4 hover:underline ${tone}`}>
        Privacy Policy
      </Link>
    </span>
  );
}

export function LegalDocument({
  title,
  summary,
  sections,
}: {
  title: string;
  summary: string;
  sections: LegalSection[];
}) {
  return (
    <article>
      <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">{title}</h1>
      <p className="mt-2 text-sm font-semibold text-ink-soft">Last updated {LEGAL_UPDATED}</p>

      <p className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-ink bg-mango px-4 py-3 font-semibold shadow-hard-sm">
        <TriangleAlert className="mt-0.5 size-5 shrink-0" strokeWidth={2.5} />
        <span>
          Placeholder text for a demo. This is not a real {title.toLowerCase()}, it has not been reviewed by a
          lawyer, and it does not bind anyone. Replace it with reviewed text before launch.
        </span>
      </p>

      <p className="mt-6 text-lg">{summary}</p>

      {sections.map((section, index) => (
        <section key={section.heading} className="mt-10">
          <h2 className="font-display text-2xl font-extrabold">
            {index + 1}. {section.heading}
          </h2>
          <div className="mt-3 grid gap-3 leading-relaxed">
            {section.blocks.map((block, blockIndex) =>
              typeof block === "string" ? (
                <p key={blockIndex}>{block}</p>
              ) : (
                <ul key={blockIndex} className="grid list-disc gap-1.5 pl-6 marker:text-tomato">
                  {block.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ),
            )}
          </div>
        </section>
      ))}
    </article>
  );
}
