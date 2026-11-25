import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { home } from "../../content/home";
import { site } from "../../content/site";
import { BookingPanel } from "../components/BookingPanel";
import { FaqSection } from "../components/FaqSection";
import { Icon } from "../components/Icon";
import {
  Reveal,
  RevealGroup,
  RevealHero,
  RevealItem,
} from "../components/Reveal";
import { SectionDivider } from "../components/SectionDivider";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof Icon>["name"];

export const metadata: Metadata = {
  title: { absolute: home.seo.title },
  description: home.seo.description,
  openGraph: {
    title: home.seo.title,
    description: home.seo.description,
  },
};

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white pb-20 pt-40 md:pb-28 md:pt-44">
        <div className="pointer-events-none absolute inset-0 dot-pattern" />
        <div className="pointer-events-none absolute -top-16 left-1/2 h-[580px] w-[980px] -translate-x-1/2 blur-[120px] hero-glow" />

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 text-center">
          <RevealHero className="mb-8 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-1.5 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-yellow" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-800">
                {home.hero.eyebrow}
              </span>
            </div>
          </RevealHero>

          <RevealHero delay={0.08} className="mx-auto mb-6 max-w-4xl">
            <h1 className="font-display select-none text-[42px] font-extrabold leading-[1.05] tracking-[-0.04em] text-brand-dark sm:text-[64px] lg:text-[78px]">
              {home.hero.title}
              <br />
              <span className="text-slate-900">{home.hero.titleAccent}</span>
            </h1>
          </RevealHero>

          <RevealHero delay={0.16}>
            <p className="mx-auto mb-9 max-w-2xl text-[16px] leading-relaxed text-slate-600 sm:text-[18px]">
              {home.hero.body}
            </p>
          </RevealHero>

          <RevealHero delay={0.24} className="mb-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <a
              href={site.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full bg-brand-yellow px-7 py-3.5 text-[14px] font-bold text-brand-charcoal shadow-[0_4px_16px_rgba(249,205,26,0.35),0_1px_2px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-dark hover:shadow-[0_8px_24px_rgba(249,205,26,0.45)]"
            >
              <span>{home.hero.ctaPrimary}</span>
              <Icon name="arrow" />
            </a>
            <a
              href={site.phoneHref}
              className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full bg-[#222226] px-6 py-3.5 text-[14px] font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#18181B]"
            >
              <Icon name="phone" className="text-brand-yellow" />
              <span>{home.hero.ctaPhone}</span>
            </a>
          </RevealHero>

          <RevealHero delay={0.32} className="mb-14 flex flex-wrap items-center justify-center gap-2">
            {home.hero.badges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm"
              >
                <Icon name="check" className="text-[12px] text-brand-accent" />
                {badge}
              </span>
            ))}
          </RevealHero>

          <RevealHero delay={0.4} className="w-full max-w-5xl">
            <div className="relative w-full rounded-[28px] border border-brand-border bg-gradient-to-b from-slate-200/80 to-slate-200/30 p-2 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] md:rounded-[36px]">
              <div className="relative h-[360px] w-full overflow-hidden rounded-[24px] sm:h-[460px] md:h-[540px] md:rounded-[32px]">
                <Image
                  src={home.hero.heroImage.src}
                  alt={home.hero.heroImage.alt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex flex-col justify-between gap-4 text-white sm:bottom-7 sm:left-7 sm:right-7 md:flex-row md:items-end">
                  <div className="max-w-md text-left">
                    <span className="mb-2 inline-block rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-yellow backdrop-blur-md sm:text-[11px]">
                      {home.hero.heroImage.caption}
                    </span>
                    <h3 className="text-[20px] font-bold leading-snug tracking-tight text-white sm:text-[24px]">
                      {home.hero.heroImage.vehicle}
                    </h3>
                    <p className="mt-1 hidden text-[13px] text-white/80 sm:block sm:text-[14px]">
                      {home.hero.heroImage.detail}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/50 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md">
                      <Icon name="verified" className="text-brand-yellow" />
                      <span>Autorisé RBC</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/50 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md">
                      <Icon name="heart" className="text-sky-400" />
                      <span>Chauffeurs formés PMR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealHero>
        </div>
      </section>

      {/* Booking panel */}
      <section
        id="reserver"
        className="relative z-30 mx-auto mb-8 -mt-16 max-w-6xl px-6 md:-mt-24"
      >
        <Reveal y={48} scale={0.95}>
          <BookingPanel />
        </Reveal>
      </section>

      <SectionDivider variant="glow" />

      {/* Reassurance */}
      <section className="mx-auto max-w-7xl px-6 py-8 md:py-12">
        <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {home.reassurance.map((p) => (
            <RevealItem key={p.title}>
              <div className="flex h-full flex-col justify-between rounded-2xl border border-brand-border bg-white p-6 shadow-sm transition-colors hover:border-slate-300 hover:shadow-md">
                <div>
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-brand-dark ${
                      p.accent ? "bg-brand-yellow/20" : "bg-slate-100"
                    }`}
                  >
                    <Icon name={p.icon as IconName} className="text-[18px]" />
                  </div>
                  <h3 className="mb-1 text-[16px] font-bold text-brand-dark">
                    {p.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-slate-600">
                    {p.body}
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {p.label}
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <SectionDivider />

      {/* Book ways */}
      <section id="comment-reserver" className="mx-auto max-w-7xl px-6 py-8 md:py-12">
        <Reveal className="mb-10 max-w-2xl">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {home.bookWays.eyebrow}
          </span>
          <h2 className="text-[30px] font-bold leading-tight tracking-tight text-brand-dark sm:text-[38px]">
            {home.bookWays.title}
          </h2>
        </Reveal>
        <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {home.bookWays.items.map((item) => (
            <RevealItem key={item.title}>
              <div className="flex h-full flex-col justify-between rounded-3xl border border-brand-border bg-white p-7 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                <div>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-yellow/20 text-brand-dark">
                    <Icon name={item.icon as IconName} className="text-[18px]" />
                  </div>
                  <h3 className="mb-2 text-[20px] font-bold text-brand-dark">
                    {item.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                </div>
                <a
                  href={item.href}
                  {...(item.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="mt-6 inline-flex items-center gap-2 text-[14px] font-bold text-brand-accent transition-transform hover:translate-x-0.5"
                >
                  {item.cta}
                  <Icon name="arrow" className="text-[12px]" />
                </a>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <SectionDivider variant="steps" />

      {/* Steps */}
      <section className="mx-auto max-w-7xl px-6 py-8 md:py-12">
        <Reveal y={40}>
          <div className="rounded-[32px] border border-brand-border bg-brand-surface p-8 md:p-12">
            <h2 className="mb-10 max-w-xl text-[30px] font-bold tracking-tight text-brand-dark sm:text-[36px]">
              {home.steps.title}
            </h2>
            <RevealGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {home.steps.items.map((s) => (
                <RevealItem key={s.step}>
                  <div className="h-full rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
                    <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-yellow text-[14px] font-extrabold text-brand-charcoal">
                      {s.step}
                    </span>
                    <h3 className="mb-2 text-[16px] font-bold text-brand-dark">
                      {s.title}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-slate-600">
                      {s.body}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
            <div className="mt-8">
              <a
                href={site.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-black"
              >
                {home.steps.cta}
                <Icon name="arrow" />
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <SectionDivider variant="glow" />

      {/* Trips */}
      <section className="mx-auto max-w-7xl px-6 py-8 md:py-12">
        <Reveal className="mb-10 max-w-3xl">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {home.trips.eyebrow}
          </span>
          <h2 className="text-[28px] font-bold leading-tight tracking-tight text-brand-dark sm:text-[36px]">
            {home.trips.title}
          </h2>
        </Reveal>
        <RevealGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {home.trips.items.map((item) => (
            <RevealItem key={item.title}>
              <div className="h-full rounded-2xl border border-brand-border bg-white p-6 shadow-sm transition-colors hover:border-slate-300 hover:shadow-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-brand-dark">
                  <Icon name={item.icon as IconName} className="text-[16px]" />
                </div>
                <h3 className="mb-1 text-[16px] font-bold text-brand-dark">
                  {item.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-slate-600">
                  {item.body}
                </p>
              </div>
            </RevealItem>
          ))}
          <RevealItem>
            <div className="flex h-full flex-col items-start justify-center rounded-2xl border border-dashed border-brand-border bg-brand-surface p-6">
              <p className="mb-4 text-[14px] font-medium text-slate-600">
                Prêt à organiser votre prochain déplacement ?
              </p>
              <a
                href={site.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-5 py-2.5 text-[13px] font-bold text-brand-charcoal transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-dark"
              >
                {home.trips.cta}
                <Icon name="arrow" />
              </a>
            </div>
          </RevealItem>
        </RevealGroup>
      </section>

      <SectionDivider />

      {/* App */}
      <section id="application" className="mx-auto max-w-7xl px-6 py-8 md:py-12">
        <Reveal y={44} scale={0.96}>
          <div className="overflow-hidden rounded-[32px] border border-brand-border bg-white p-8 shadow-sm md:p-12">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              <div className="flex flex-col gap-6 lg:col-span-7">
                <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                  {home.app.eyebrow}
                </div>
                <h2 className="text-[30px] font-bold leading-tight tracking-tight text-brand-dark sm:text-[38px]">
                  {home.app.title}
                </h2>
                <p className="text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
                  {home.app.body}
                </p>
                <RevealGroup className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                  {home.app.features.map((f) => (
                    <RevealItem key={f.title}>
                      <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
                        <div className="mb-1 flex items-center gap-2 text-[13px] font-bold text-brand-dark">
                          <Icon
                            name={f.icon as IconName}
                            className="text-[16px] text-brand-yellow"
                          />
                          <span>{f.title}</span>
                        </div>
                        <p className="text-[12px] text-slate-500">{f.body}</p>
                      </div>
                    </RevealItem>
                  ))}
                </RevealGroup>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={site.appStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 rounded-full bg-brand-dark px-5 py-3 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-black"
                  >
                    <Icon name="apple" className="text-[18px]" />
                    <span>Télécharger sur l’App Store</span>
                  </a>
                  <a
                    href={site.playStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 rounded-full bg-brand-dark px-5 py-3 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-black"
                  >
                    <Icon name="android" className="text-[18px]" />
                    <span>Télécharger sur Google Play</span>
                  </a>
                </div>
              </div>

              <Reveal
                className="flex justify-center lg:col-span-5"
                x={40}
                y={0}
                delay={0.15}
              >
                <div className="relative h-[520px] w-[270px] rounded-[48px] bg-brand-dark p-3.5 shadow-2xl ring-1 ring-slate-800 sm:w-[290px]">
                  <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[38px] border border-slate-200 bg-white">
                    <div className="z-20 mx-auto h-4 w-24 rounded-b-xl bg-brand-dark" />
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-yellow text-[12px] text-brand-dark">
                            <Icon name="accessible" className="text-[12px]" />
                          </span>
                          <span className="text-[14px] font-bold text-brand-dark">
                            Handycab
                          </span>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                          Disponible
                        </span>
                      </div>

                      <div className="relative my-2 h-40 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        <Image
                          src="/images/EDA_6604.jpg"
                          alt="Application Handycab"
                          fill
                          className="object-cover"
                          sizes="300px"
                        />
                      </div>

                      <div className="space-y-2">
                        {["Course immédiate", "Course planifiée", "Assistance"].map(
                          (label) => (
                            <div
                              key={label}
                              className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-[12px] font-semibold text-brand-dark"
                            >
                              <span>{label}</span>
                              <Icon
                                name="arrow"
                                className="text-[11px] text-slate-400"
                              />
                            </div>
                          ),
                        )}
                      </div>

                      <a
                        href={site.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full rounded-full bg-brand-yellow py-2.5 text-center text-[12px] font-bold text-brand-charcoal shadow-sm"
                      >
                        Réserver un taxi
                      </a>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </section>

      <SectionDivider variant="glow" />

      {/* Mission */}
      <section className="mx-auto max-w-7xl px-6 py-8 md:py-12">
        <Reveal y={40} scale={0.97}>
          <div className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[32px] border border-brand-border bg-white lg:grid-cols-2">
            <div className="relative min-h-[280px] lg:min-h-[420px]">
              <Image
                src="/images/EDA_4420.jpg"
                alt="Mobility accessible Handycab"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="p-8 md:p-12">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {home.mission.eyebrow}
              </span>
              <h2 className="text-[28px] font-bold leading-tight tracking-tight text-brand-dark sm:text-[34px]">
                {home.mission.title}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
                {home.mission.body}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/a-propos"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-5 py-3 text-[13px] font-semibold text-white transition-all hover:bg-black"
                >
                  {home.mission.ctaPrimary}
                  <Icon name="arrow" />
                </Link>
                <a
                  href={site.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-brand-border px-5 py-3 text-[13px] font-semibold text-brand-dark transition-all hover:bg-brand-surface"
                >
                  {home.mission.ctaSecondary}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <FaqSection
        items={home.faq.items}
        title={home.faq.title}
        intro={home.faq.intro}
      />

      <SectionDivider variant="steps" />

      {/* Final CTA */}
      <section id="contact" className="mx-auto mb-20 max-w-7xl px-6 py-6">
        <Reveal y={48} scale={0.96}>
          <div className="relative overflow-hidden rounded-[32px] bg-brand-dark p-8 text-white shadow-2xl sm:p-12 lg:p-16">
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-brand-yellow/10 blur-[100px]" />
            <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <h2 className="text-[32px] font-bold leading-tight tracking-tight text-white sm:text-[42px]">
                  {home.cta.title}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-400 sm:text-[17px]">
                  {home.cta.body}
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:shrink-0">
                <a
                  href={site.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-brand-yellow px-8 py-4 text-[16px] font-bold text-brand-charcoal shadow-[0_6px_20px_rgba(249,205,26,0.3)] transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-dark"
                >
                  <span>{home.cta.primary}</span>
                  <Icon name="arrow" />
                </a>
                <a
                  href={site.phoneHref}
                  className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/10 px-7 py-4 text-[15px] font-medium text-white transition-all hover:bg-white/15"
                >
                  <Icon name="phone" className="text-brand-yellow" />
                  <span>{home.cta.secondary}</span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
