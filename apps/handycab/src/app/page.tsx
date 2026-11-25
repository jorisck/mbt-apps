import Image from "next/image";
import { home } from "../../content/home";
import { site } from "../../content/site";
import { EstimateForm } from "../components/EstimateForm";
import { Icon } from "../components/Icon";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof Icon>["name"];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white pb-20 pt-36 md:pb-28">
        <div className="pointer-events-none absolute inset-0 dot-pattern" />
        <div className="pointer-events-none absolute -top-16 left-1/2 h-[580px] w-[980px] -translate-x-1/2 blur-[120px] hero-glow" />

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 text-center">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-1.5 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-yellow" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-800">
                {home.hero.badge}
              </span>
            </div>
            <a
              href={site.parent.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-white px-3.5 py-1.5 shadow-sm transition-all hover:border-brand-accent"
            >
              <span className="text-[12px] font-medium text-slate-600">
                Un service officiel de
              </span>
              <strong className="text-[12px] font-semibold text-brand-accent">
                {site.parent.name}
              </strong>
              <span className="text-[11px] text-brand-accent transition-transform group-hover:translate-x-0.5">
                ↗
              </span>
            </a>
          </div>

          <div className="mx-auto mb-6 max-w-4xl">
            <h1 className="font-display select-none text-[64px] font-extrabold uppercase leading-[0.95] tracking-[-0.04em] text-brand-dark sm:text-[84px] lg:text-[98px]">
              {home.hero.title}
            </h1>
            <p className="mt-3 font-display text-[26px] font-semibold tracking-[-0.025em] text-slate-900 sm:text-[34px] lg:text-[40px]">
              {home.hero.subtitle}
            </p>
          </div>

          <p className="mx-auto mb-9 max-w-2xl text-[16px] leading-relaxed text-slate-600 sm:text-[18px]">
            {home.hero.body}
          </p>

          <div className="mb-16 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <a
              href="#calculateur"
              className="inline-flex items-center gap-2.5 rounded-full bg-brand-yellow px-7 py-3.5 text-[14px] font-bold text-brand-charcoal shadow-[0_4px_16px_rgba(249,205,26,0.35),0_1px_2px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-dark hover:shadow-[0_8px_24px_rgba(249,205,26,0.45)]"
            >
              <span>{home.hero.ctaPrimary}</span>
              <Icon name="arrow" />
            </a>
            <a
              href={site.phoneHref}
              className="inline-flex items-center gap-2.5 rounded-full bg-[#222226] px-6 py-3.5 text-[14px] font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#18181B]"
            >
              <Icon name="phone" className="text-brand-yellow" />
              <span>
                {home.hero.ctaSecondary} : {site.phone}
              </span>
            </a>
          </div>

          <div className="relative w-full max-w-5xl rounded-[28px] border border-brand-border bg-gradient-to-b from-slate-200/80 to-slate-200/30 p-2 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] md:rounded-[36px]">
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
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/50 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md">
                    <Icon name="verified" className="text-brand-yellow" />
                    <span>Norme ISO 10542</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/50 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md">
                    <Icon name="heart" className="text-sky-400" />
                    <span>Agréé COCOM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estimate */}
      <section
        id="calculateur"
        className="relative z-30 mx-auto mb-24 -mt-16 max-w-6xl px-6 md:-mt-24"
      >
        <EstimateForm />
      </section>

      {/* Pillars */}
      <section className="mx-auto mb-16 max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {home.pillars.map((p) => (
            <div
              key={p.title}
              className="flex flex-col justify-between rounded-2xl border border-brand-border bg-white p-6 shadow-sm transition-colors hover:border-slate-300"
            >
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
          ))}
        </div>
      </section>

      {/* Fleet */}
      <section id="flotte" className="mx-auto mb-16 max-w-7xl px-6 py-12">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              {home.fleet.eyebrow}
            </span>
            <h2 className="text-[32px] font-bold leading-tight tracking-tight text-brand-dark sm:text-[38px]">
              {home.fleet.title}
            </h2>
          </div>
          <p className="max-w-md text-[15px] text-slate-600">{home.fleet.intro}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="group flex flex-col justify-between rounded-3xl border border-brand-border bg-white p-7 shadow-sm transition-all hover:border-slate-300 sm:p-9 lg:col-span-7">
            <div>
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-bold text-brand-dark">
                  {home.fleet.main.badge}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {home.fleet.main.status}
                </span>
              </div>
              <h3 className="mb-2 text-[22px] font-bold tracking-tight text-brand-dark sm:text-[26px]">
                {home.fleet.main.title}
              </h3>
              <p className="max-w-xl text-[14px] leading-relaxed text-slate-600">
                {home.fleet.main.body}
              </p>
            </div>

            <div className="relative my-6 h-64 overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100 sm:h-72">
              <Image
                src={home.fleet.main.image.src}
                alt={home.fleet.main.image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2 text-[12px] font-medium text-white">
                <Icon name="verified" className="text-brand-yellow" />
                <span>{home.fleet.main.image.caption}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {home.fleet.main.stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-brand-border bg-brand-surface p-3.5 text-center"
                >
                  <span className="block text-[10px] font-bold uppercase text-slate-500">
                    {s.label}
                  </span>
                  <span className="text-[18px] font-extrabold text-brand-dark">
                    {s.value}
                  </span>
                  <span className="block text-[11px] text-slate-500">{s.hint}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            {home.fleet.side.map((card) => (
              <div
                key={card.title}
                className="flex flex-1 flex-col justify-between rounded-3xl border border-brand-border bg-white p-7 shadow-sm transition-all hover:border-slate-300"
              >
                <div>
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-brand-dark ${
                      card.icon === "ramp" ? "bg-brand-yellow/20" : "bg-slate-100"
                    }`}
                  >
                    <Icon name={card.icon as IconName} className="text-[18px]" />
                  </div>
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {card.eyebrow}
                  </span>
                  <h3 className="mb-2 text-[20px] font-bold tracking-tight text-brand-dark">
                    {card.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-slate-600">
                    {card.body}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-brand-border bg-brand-surface p-3.5 text-[12px] font-semibold text-slate-700">
                  <span>{card.metaLabel}</span>
                  <span className="font-bold text-brand-dark">{card.metaValue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Drivers */}
      <section id="chauffeurs" className="mx-auto mb-16 max-w-7xl px-6 py-12">
        <div className="rounded-[32px] border border-brand-border bg-brand-surface p-8 md:p-12">
          <div className="mb-10 max-w-2xl">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              {home.drivers.eyebrow}
            </span>
            <h2 className="text-[30px] font-bold tracking-tight text-brand-dark sm:text-[36px]">
              {home.drivers.title}
            </h2>
            <p className="mt-2 text-[15px] text-slate-600">{home.drivers.intro}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {home.drivers.items.map((d) => (
              <div
                key={d.name}
                className="flex flex-col justify-between rounded-2xl border border-brand-border bg-white p-7 shadow-sm"
              >
                <div>
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-yellow bg-slate-100 font-display text-[18px] font-bold text-brand-dark">
                      {d.initials}
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold leading-snug text-brand-dark">
                        {d.name}
                      </h3>
                      <p className="text-[12px] text-slate-500">{d.role}</p>
                      <div className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-amber-500">
                        <Icon name="star" className="text-[13px]" />
                        <span>{d.rating}</span>
                        <span className="font-normal text-slate-400">
                          ({d.rides})
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[14px] italic leading-relaxed text-slate-600">
                    {d.quote}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-[11px]">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                    {d.badge}
                  </span>
                  <span className="font-medium text-slate-500">{d.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App */}
      <section id="application" className="mx-auto mb-16 max-w-7xl px-6 py-12">
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
              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                {home.app.features.map((f) => (
                  <div
                    key={f.title}
                    className="rounded-xl border border-brand-border bg-brand-surface p-4"
                  >
                    <div className="mb-1 flex items-center gap-2 text-[13px] font-bold text-brand-dark">
                      <Icon
                        name={f.icon as IconName}
                        className="text-[16px] text-brand-yellow"
                      />
                      <span>{f.title}</span>
                    </div>
                    <p className="text-[12px] text-slate-500">{f.body}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#"
                  className="inline-flex items-center gap-2.5 rounded-full bg-brand-dark px-5 py-3 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-black"
                >
                  <Icon name="apple" className="text-[18px]" />
                  <span>Télécharger sur l’App Store</span>
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-2.5 rounded-full bg-brand-dark px-5 py-3 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-black"
                >
                  <Icon name="android" className="text-[18px]" />
                  <span>Disponible sur Google Play</span>
                </a>
              </div>
            </div>

            <div className="flex justify-center lg:col-span-5">
              <div className="relative h-[580px] w-[280px] rounded-[48px] bg-brand-dark p-3.5 shadow-2xl ring-1 ring-slate-800 sm:w-[300px]">
                <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[38px] border border-slate-200 bg-white">
                  <div className="z-20 mx-auto h-4 w-24 rounded-b-xl bg-brand-dark" />
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-yellow text-[12px] text-brand-dark">
                          <Icon name="accessible" className="text-[12px]" />
                        </span>
                        <span className="text-[14px] font-bold text-brand-dark">
                          HandyCab
                        </span>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        En approche
                      </span>
                    </div>

                    <div className="relative my-2 h-44 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <Image
                        src="/images/EDA_6604.jpg"
                        alt="Carte de suivi GPS"
                        fill
                        className="object-cover"
                        sizes="300px"
                      />
                      <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-bounce items-center justify-center rounded-full bg-brand-yellow text-brand-dark shadow-lg">
                        <Icon name="car" className="text-[14px]" />
                      </div>
                      <div className="absolute inset-x-2 bottom-2 flex items-center justify-between rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-800 backdrop-blur-sm">
                        <span>Arrivée estimée :</span>
                        <span className="font-extrabold text-brand-dark">
                          3 min
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-surface p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                          <Icon name="user" />
                        </div>
                        <div>
                          <div className="text-[12px] font-bold text-brand-dark">
                            Jean-Marc D.
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Mercedes eVito • TX-PMR-092
                          </div>
                        </div>
                      </div>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-border bg-white text-brand-dark">
                        <Icon name="phone" className="text-[12px]" />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full rounded-full bg-brand-yellow py-2.5 text-[12px] font-bold text-brand-charcoal shadow-sm"
                    >
                      Partager le suivi (SMS)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="contact" className="mx-auto mb-20 max-w-7xl px-6 py-6">
        <div
          id="tarifs"
          className="relative overflow-hidden rounded-[32px] bg-brand-dark p-8 text-white shadow-2xl sm:p-12 lg:p-16"
        >
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-brand-yellow/10 blur-[100px]" />
          <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-yellow">
                <span className="h-2 w-2 animate-ping rounded-full bg-brand-yellow" />
                {home.cta.badge}
              </div>
              <h2 className="text-[32px] font-bold leading-tight tracking-tight text-white sm:text-[42px]">
                {home.cta.title}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-400 sm:text-[17px]">
                {home.cta.body}
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <a
                href={site.phoneHref}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-brand-yellow px-8 py-4 text-[16px] font-bold text-brand-charcoal shadow-[0_6px_20px_rgba(249,205,26,0.3)] transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-dark"
              >
                <Icon name="phone" className="text-[18px]" />
                <span>{site.phone}</span>
              </a>
              <a
                href="#calculateur"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-7 py-4 text-[15px] font-medium text-white transition-all hover:bg-white/15"
              >
                <span>Réserver en ligne</span>
                <Icon name="arrow" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
