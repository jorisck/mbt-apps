import type { Metadata } from "next";
import Link from "next/link";
import { application } from "../../../content/pages";
import { site } from "../../../content/site";
import { FaqSection } from "../../components/FaqSection";
import { Icon } from "../../components/Icon";
import { PageHero } from "../../components/PageHero";
import { Reveal, RevealGroup, RevealItem } from "../../components/Reveal";
import { SectionDivider } from "../../components/SectionDivider";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof Icon>["name"];

export const metadata: Metadata = {
  title: application.seo.title,
  description: application.seo.description,
};

export default function ApplicationPage() {
  return (
    <>
      <PageHero
        eyebrow={application.hero.eyebrow}
        title={application.hero.title}
        body={application.hero.body}
        primaryHref={site.playStoreUrl}
        primaryLabel="Télécharger sur Google Play"
        secondaryHref={site.appStoreUrl}
        secondaryLabel="Télécharger sur l’App Store"
        secondaryExternal
      />

      <SectionDivider variant="glow" />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <RevealGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {application.features.map((f) => (
            <RevealItem key={f.title}>
              <div className="h-full rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-yellow/20 text-brand-dark">
                  <Icon name={f.icon as IconName} />
                </div>
                <h3 className="text-[16px] font-bold text-brand-dark">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                  {f.body}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
        <Reveal delay={0.1}>
          <p className="mt-6 rounded-2xl border border-slate-200 bg-brand-surface px-5 py-4 text-[13px] text-slate-600">
            {application.note}
          </p>
        </Reveal>
      </section>

      <SectionDivider variant="steps" />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <RevealItem>
            <a
              href={site.playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block h-full rounded-[28px] border border-brand-border bg-white p-8 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              <Icon name="android" className="text-[28px] text-brand-dark" />
              <h3 className="mt-4 text-[22px] font-bold text-brand-dark">
                Android
              </h3>
              <p className="mt-2 text-[14px] text-slate-600">
                Disponible gratuitement sur Google Play.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-brand-accent group-hover:translate-x-0.5">
                Télécharger pour Android
                <Icon name="arrow" className="text-[12px]" />
              </span>
            </a>
          </RevealItem>
          <RevealItem>
            <a
              href={site.appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block h-full rounded-[28px] border border-brand-border bg-white p-8 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              <Icon name="apple" className="text-[28px] text-brand-dark" />
              <h3 className="mt-4 text-[22px] font-bold text-brand-dark">
                iPhone et iPad
              </h3>
              <p className="mt-2 text-[14px] text-slate-600">
                Disponible gratuitement sur l’App Store.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-brand-accent group-hover:translate-x-0.5">
                Télécharger pour iPhone
                <Icon name="arrow" className="text-[12px]" />
              </span>
            </a>
          </RevealItem>
        </RevealGroup>
      </section>

      <SectionDivider />

      <section className="mx-auto mb-20 max-w-7xl px-6 py-10">
        <RevealGroup className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevealItem>
            <div className="h-full rounded-[28px] border border-brand-border bg-brand-surface p-8">
              <h2 className="text-[22px] font-bold text-brand-dark">
                {application.webAlt.title}
              </h2>
              <p className="mt-3 text-[14px] text-slate-600">
                {application.webAlt.body}
              </p>
              <a
                href={site.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-dark px-5 py-3 text-[13px] font-semibold text-white"
              >
                {application.webAlt.cta}
                <Icon name="arrow" />
              </a>
            </div>
          </RevealItem>
          <RevealItem>
            <div className="h-full rounded-[28px] border border-brand-border bg-white p-8 shadow-sm">
              <h2 className="text-[22px] font-bold text-brand-dark">
                {application.help.title}
              </h2>
              <p className="mt-3 text-[14px] text-slate-600">
                {application.help.body}
              </p>
              <Link
                href="/aide"
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-border px-5 py-3 text-[13px] font-semibold text-brand-dark"
              >
                {application.help.cta}
                <Icon name="arrow" />
              </Link>
            </div>
          </RevealItem>
        </RevealGroup>
      </section>

      <FaqSection
        items={application.faq.items}
        title={application.faq.title}
        intro={application.faq.intro}
      />
      <div className="mb-16" />
    </>
  );
}
