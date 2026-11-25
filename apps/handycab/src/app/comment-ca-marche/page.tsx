import type { Metadata } from "next";
import { howItWorks } from "../../../content/pages";
import { site } from "../../../content/site";
import { FaqSection } from "../../components/FaqSection";
import { Icon } from "../../components/Icon";
import { PageHero } from "../../components/PageHero";
import { Reveal, RevealGroup, RevealItem } from "../../components/Reveal";
import { SectionDivider } from "../../components/SectionDivider";

export const metadata: Metadata = {
  title: howItWorks.seo.title,
  description: howItWorks.seo.description,
};

export default function CommentCaMarchePage() {
  return (
    <>
      <PageHero
        eyebrow={howItWorks.hero.eyebrow}
        title={howItWorks.hero.title}
        body={howItWorks.hero.body}
        secondaryHref="/application"
        secondaryLabel="Télécharger l’application"
      />

      <SectionDivider variant="glow" />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Reveal className="rounded-[28px] border border-brand-border bg-white p-8 shadow-sm">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Méthode 1
            </span>
            <h2 className="text-[26px] font-bold tracking-tight text-brand-dark">
              {howItWorks.web.title}
            </h2>
            <ol className="mt-6 space-y-3">
              {howItWorks.web.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-[14px] text-slate-700">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-[12px] font-bold text-brand-charcoal">
                    {i + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
            <a
              href={site.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-dark px-5 py-3 text-[13px] font-semibold text-white hover:bg-black"
            >
              {howItWorks.web.cta}
              <Icon name="arrow" />
            </a>
          </Reveal>

          <div className="flex flex-col gap-6">
            <Reveal
              delay={0.1}
              className="rounded-[28px] border border-brand-border bg-brand-surface p-8"
            >
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Méthode 2
              </span>
              <h2 className="text-[24px] font-bold tracking-tight text-brand-dark">
                {howItWorks.app.title}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                {howItWorks.app.body}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={site.playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-4 py-2.5 text-[12px] font-semibold text-white"
                >
                  <Icon name="android" /> Android
                </a>
                <a
                  href={site.appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-4 py-2.5 text-[12px] font-semibold text-white"
                >
                  <Icon name="apple" /> iPhone
                </a>
              </div>
            </Reveal>

            <Reveal
              delay={0.18}
              className="rounded-[28px] border border-brand-border bg-white p-8 shadow-sm"
            >
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Méthode 3
              </span>
              <h2 className="text-[24px] font-bold tracking-tight text-brand-dark">
                {howItWorks.phone.title}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                {howItWorks.phone.body}
              </p>
              <p className="mt-4 text-[13px] font-semibold text-brand-dark">
                Avant d’appeler, préparez si possible :
              </p>
              <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {howItWorks.phone.prepare.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[13px] text-slate-600"
                  >
                    <Icon name="check" className="mt-0.5 text-brand-accent" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={site.phoneHref}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-yellow px-5 py-3 text-[13px] font-bold text-brand-charcoal"
              >
                <Icon name="phone" />
                {howItWorks.phone.cta}
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      <SectionDivider variant="steps" />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <RevealItem>
            <div className="h-full rounded-3xl border border-brand-border bg-white p-7 shadow-sm">
              <h3 className="text-[20px] font-bold text-brand-dark">
                {howItWorks.timing.immediate.title}
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                {howItWorks.timing.immediate.body}
              </p>
            </div>
          </RevealItem>
          <RevealItem>
            <div className="h-full rounded-3xl border border-brand-border bg-white p-7 shadow-sm">
              <h3 className="text-[20px] font-bold text-brand-dark">
                {howItWorks.timing.planned.title}
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                {howItWorks.timing.planned.body}
              </p>
            </div>
          </RevealItem>
        </RevealGroup>
        <Reveal delay={0.15}>
          <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13px] text-amber-950">
            {howItWorks.timing.note}
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <Reveal y={48}>
          <div className="rounded-[32px] border border-brand-border bg-brand-surface p-8 md:p-12">
            <h2 className="text-[28px] font-bold text-brand-dark">
              {howItWorks.before.title}
            </h2>
            <ul className="mt-6 space-y-3">
              {howItWorks.before.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-[15px] text-slate-700"
                >
                  <Icon name="check" className="mt-1 text-brand-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href={site.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[14px] font-bold text-brand-charcoal"
            >
              {howItWorks.before.cta}
              <Icon name="arrow" />
            </a>
          </div>
        </Reveal>
      </section>

      <FaqSection
        items={howItWorks.faq.items}
        title={howItWorks.faq.title}
        intro={howItWorks.faq.intro}
      />
      <div className="mb-16" />
    </>
  );
}
