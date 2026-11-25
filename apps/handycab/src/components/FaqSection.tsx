import Link from "next/link";
import { Icon } from "./Icon";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { SectionDivider } from "./SectionDivider";

export type FaqItem = {
  q: string;
  a: string;
};

export function FaqSection({
  items,
  title = "Questions fréquentes",
  eyebrow = "FAQ",
  intro,
  id = "faq",
  showMoreHref = "/aide#faq",
  showMoreLabel = "Voir toutes les questions",
  divider = true,
}: {
  items: readonly FaqItem[];
  title?: string;
  eyebrow?: string;
  intro?: string;
  id?: string;
  showMoreHref?: string | null;
  showMoreLabel?: string;
  divider?: boolean;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      {divider ? <SectionDivider variant="glow" /> : null}
      <section id={id} className="mx-auto max-w-3xl px-6 py-10 md:py-14">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Reveal className="mb-8 text-center sm:text-left">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {eyebrow}
          </span>
          <h2 className="text-[28px] font-bold tracking-tight text-brand-dark sm:text-[32px]">
            {title}
          </h2>
          {intro ? (
            <p className="mt-2 text-[15px] text-slate-600">{intro}</p>
          ) : null}
        </Reveal>

        <RevealGroup className="space-y-3">
          {items.map((item) => (
            <RevealItem key={item.q}>
              <details className="group rounded-2xl border border-brand-border bg-white p-5 shadow-sm transition-shadow open:shadow-md">
                <summary className="cursor-pointer list-none text-[15px] font-bold text-brand-dark marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-4">
                    <span>{item.q}</span>
                    <Icon
                      name="arrow"
                      className="mt-1 shrink-0 rotate-90 text-[12px] text-slate-400 transition-transform group-open:-rotate-90"
                    />
                  </span>
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                  {item.a}
                </p>
              </details>
            </RevealItem>
          ))}
        </RevealGroup>

        {showMoreHref ? (
          <Reveal delay={0.1} className="mt-6 text-center sm:text-left">
            <Link
              href={showMoreHref}
              className="inline-flex items-center gap-2 text-[14px] font-bold text-brand-accent transition-transform hover:translate-x-0.5"
            >
              {showMoreLabel}
              <Icon name="arrow" className="text-[12px]" />
            </Link>
          </Reveal>
        ) : null}
      </section>
    </>
  );
}
