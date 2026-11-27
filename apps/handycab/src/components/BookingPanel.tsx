"use client";

import { site } from "../../content/site";
import { Icon } from "./Icon";
import { RevealGroup, RevealItem } from "./Reveal";

const channels = [
  {
    icon: "calc" as const,
    title: "Plateforme web",
    body: "Réservez sans installer d’application.",
    href: "/demande",
    cta: "Réserver",
    external: false,
  },
  {
    icon: "phone" as const,
    title: "Application",
    body: "Android, iPhone et iPad.",
    href: "/application",
    cta: "Voir",
    external: false,
  },
  {
    icon: "heart" as const,
    title: "Assistance",
    body: `Ligne dédiée ${site.phone}`,
    href: site.phoneHref,
    cta: "Appeler",
    external: false,
  },
] as const;

export function BookingPanel() {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-brand-border bg-white p-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.03)] md:p-9">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-yellow/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-brand-accent/10 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-yellow/20 text-brand-dark">
            <Icon name="accessible" className="text-[20px]" />
          </div>
          <div>
            <h2 className="text-[19px] font-bold tracking-tight text-brand-dark sm:text-[21px]">
              Réserver un taxi adapté
            </h2>
            <p className="text-[13px] text-slate-500">
              Immédiatement ou planifié — web, app ou téléphone
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200/60 bg-emerald-50 px-3.5 py-1.5 text-[12px] font-semibold text-emerald-800 sm:self-center">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span>Tarif identique à un taxi ordinaire</span>
        </div>
      </div>

      <RevealGroup className="relative mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {channels.map((c) => (
          <RevealItem key={c.title}>
            <a
              href={c.href}
              {...(c.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="group flex h-full flex-col justify-between rounded-2xl border border-brand-border bg-brand-surface p-5 transition-all hover:border-slate-300 hover:bg-white hover:shadow-md"
            >
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-dark shadow-sm">
                  <Icon name={c.icon} className="text-[16px]" />
                </div>
                <h3 className="text-[15px] font-bold text-brand-dark">{c.title}</h3>
                <p className="mt-1 text-[13px] text-slate-600">{c.body}</p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-accent transition-transform group-hover:translate-x-0.5">
                {c.cta}
                <Icon name="arrow" className="text-[12px]" />
              </span>
            </a>
          </RevealItem>
        ))}
      </RevealGroup>

      <div className="relative mt-6 flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-brand-border bg-brand-dark p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-[14px] font-semibold text-white">
            Prêt à commander votre course ?
          </p>
          <p className="text-[12px] text-slate-400">
            Accédez directement à la plateforme de réservation Handycab.
          </p>
        </div>
        <a
          href="/demande"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[13px] font-bold text-brand-charcoal shadow-[0_4px_14px_rgba(249,205,26,0.3)] transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-dark"
        >
          <span>Réserver maintenant</span>
          <Icon name="arrow" />
        </a>
      </div>
    </div>
  );
}
