import type { Metadata } from "next";
import Image from "next/image";
import { service } from "../../../content/pages";
import { site } from "../../../content/site";
import { FaqSection } from "../../components/FaqSection";
import { Icon } from "../../components/Icon";
import { PageHero } from "../../components/PageHero";
import { Reveal, RevealGroup, RevealItem } from "../../components/Reveal";
import { SectionDivider } from "../../components/SectionDivider";

export const metadata: Metadata = {
  title: service.seo.title,
  description: service.seo.description,
};

export default function LeServicePage() {
  return (
    <>
      <PageHero
        eyebrow={service.hero.eyebrow}
        title={service.hero.title}
        body={service.hero.body}
        primaryLabel="Réserver un taxi adapté"
        secondaryHref="/aide"
        secondaryLabel="Poser une question"
      />

      <SectionDivider variant="glow" />

      <section id="vehicules" className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-[28px] font-bold tracking-tight text-brand-dark sm:text-[34px]">
              {service.vehicles.title}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
              {service.vehicles.body}
            </p>
            <p className="mt-6 text-[13px] font-bold uppercase tracking-wider text-slate-500">
              À communiquer lors de la réservation
            </p>
            <ul className="mt-3 space-y-2">
              {service.vehicles.infos.map((info) => (
                <li
                  key={info}
                  className="flex items-start gap-2 text-[14px] text-slate-700"
                >
                  <Icon name="check" className="mt-0.5 text-brand-accent" />
                  {info}
                </li>
              ))}
            </ul>
            <a
              href={site.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-yellow px-5 py-3 text-[13px] font-bold text-brand-charcoal"
            >
              {service.vehicles.cta}
              <Icon name="arrow" />
            </a>
          </Reveal>
          <Reveal x={36} y={0} delay={0.1}>
            <div className="relative h-[360px] overflow-hidden rounded-[28px] border border-brand-border shadow-sm sm:h-[420px]">
              <Image
                src="/images/EDA_4420.jpg"
                alt="Taxi adapté Handycab"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <SectionDivider variant="steps" />

      <section id="chauffeurs" className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[32px] border border-brand-border bg-brand-surface p-8 md:p-12">
          <h2 className="max-w-2xl text-[28px] font-bold tracking-tight text-brand-dark sm:text-[34px]">
            {service.drivers.title}
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-slate-600">
            {service.drivers.body}
          </p>
          <RevealGroup className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {service.drivers.commitments.map((item) => (
              <RevealItem key={item}>
                <div className="h-full rounded-2xl border border-brand-border bg-white p-5 text-[14px] font-medium text-brand-dark shadow-sm">
                  <Icon name="shield" className="mb-2 text-brand-yellow" />
                  {item}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <SectionDivider />

      <section id="tarifs" className="mx-auto max-w-7xl px-6 py-10">
        <RevealGroup className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevealItem>
            <div className="h-full rounded-[28px] border border-brand-border bg-white p-8 shadow-sm">
              <h2 className="text-[26px] font-bold tracking-tight text-brand-dark">
                {service.pricing.title}
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600">
                {service.pricing.body}
              </p>
              <p className="mt-4 rounded-xl border border-slate-200 bg-brand-surface p-4 text-[13px] text-slate-600">
                {service.pricing.note}
              </p>
              <a
                href={site.conditionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-[14px] font-bold text-brand-accent"
              >
                {service.pricing.cta}
                <Icon name="arrow" className="text-[12px]" />
              </a>
            </div>
          </RevealItem>

          <RevealItem>
            <div
              id="paiement"
              className="h-full rounded-[28px] border border-brand-border bg-brand-dark p-8 text-white"
            >
              <h2 className="text-[26px] font-bold tracking-tight">
                {service.payment.title}
              </h2>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {service.payment.methods.map((method) => (
                  <div
                    key={method}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-[14px] font-semibold"
                  >
                    {method}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[13px] text-slate-400">
                {service.payment.note}
              </p>
              <p className="mt-8 text-[18px] font-semibold">
                {service.payment.closing}
              </p>
              <a
                href={site.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-yellow px-5 py-3 text-[13px] font-bold text-brand-charcoal"
              >
                {service.payment.cta}
                <Icon name="arrow" />
              </a>
            </div>
          </RevealItem>
        </RevealGroup>
      </section>

      <FaqSection
        items={service.faq.items}
        title={service.faq.title}
        intro={service.faq.intro}
      />
      <div className="mb-16" />
    </>
  );
}
