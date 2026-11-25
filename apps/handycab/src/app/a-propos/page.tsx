import type { Metadata } from "next";
import Link from "next/link";
import { about } from "../../../content/pages";
import { site } from "../../../content/site";
import { FaqSection } from "../../components/FaqSection";
import { Icon } from "../../components/Icon";
import { PageHero } from "../../components/PageHero";
import { Reveal, RevealGroup, RevealItem } from "../../components/Reveal";
import { SectionDivider } from "../../components/SectionDivider";

export const metadata: Metadata = {
  title: about.seo.title,
  description: about.seo.description,
};

export default function AProposPage() {
  return (
    <>
      <PageHero
        eyebrow={about.hero.eyebrow}
        title={about.hero.title}
        body={about.hero.body}
        primaryLabel="Réserver un taxi"
        secondaryHref="/aide"
        secondaryLabel="Nous contacter"
      />

      <SectionDivider variant="glow" />

      <section className="mx-auto max-w-3xl px-6 py-10">
        <Reveal>
          <h2 className="text-[28px] font-bold text-brand-dark">{about.why.title}</h2>
          <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-slate-600">
            {about.why.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>
      </section>

      <SectionDivider variant="steps" />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <RevealGroup className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevealItem>
            <div className="h-full rounded-[28px] border border-brand-border bg-white p-8 shadow-sm">
              <h2 className="text-[24px] font-bold text-brand-dark">
                {about.brussels.title}
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600">
                {about.brussels.body}
              </p>
              <p className="mt-4 rounded-xl border border-slate-200 bg-brand-surface p-4 text-[13px] text-slate-600">
                {about.brussels.legal}
              </p>
            </div>
          </RevealItem>
          <RevealItem>
            <div className="h-full rounded-[28px] border border-brand-border bg-brand-surface p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-yellow/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-charcoal">
                <Icon name="star" className="text-brand-yellow" />
                Prix CAP48
              </div>
              <h2 className="text-[24px] font-bold text-brand-dark">
                {about.award.title}
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600">
                {about.award.body}
              </p>
            </div>
          </RevealItem>
        </RevealGroup>
      </section>

      <FaqSection
        items={about.faq.items}
        title={about.faq.title}
        intro={about.faq.intro}
      />

      <section className="mx-auto mb-20 max-w-7xl px-6 py-6">
        <Reveal y={48} className="relative overflow-hidden rounded-[32px] bg-brand-dark p-8 text-white sm:p-12">
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-brand-yellow/10 blur-[90px]" />
          <h2 className="relative z-10 text-[28px] font-bold sm:text-[34px]">
            {about.cta.title}
          </h2>
          <div className="relative z-10 mt-6 flex flex-wrap gap-3">
            <a
              href={site.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[14px] font-bold text-brand-charcoal"
            >
              {about.cta.primary}
              <Icon name="arrow" />
            </a>
            <Link
              href="/application"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-[14px] font-medium text-white"
            >
              {about.cta.secondary}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
