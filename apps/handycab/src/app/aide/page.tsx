"use client";

import { help } from "../../../content/pages";
import { site } from "../../../content/site";
import { FaqSection } from "../../components/FaqSection";
import { Icon } from "../../components/Icon";
import { PageHero } from "../../components/PageHero";
import { Reveal, RevealGroup, RevealItem } from "../../components/Reveal";
import { SectionDivider } from "../../components/SectionDivider";

export default function AidePage() {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.currentTarget.reset();
    alert("Merci. Votre message a bien été envoyé (démo).");
  }

  return (
    <>
      <PageHero
        eyebrow={help.hero.eyebrow}
        title={help.hero.title}
        body={help.hero.body}
        primaryHref={site.phoneHref}
        primaryLabel={`Appeler le ${site.phone}`}
        primaryExternal
        secondaryHref={site.bookingUrl}
        secondaryLabel="Réserver en ligne"
        secondaryExternal
      />

      <SectionDivider variant="glow" />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <RevealGroup className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <RevealItem>
            <a
              href={site.phoneHref}
              className="block h-full rounded-2xl border border-brand-border bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <Icon name="phone" className="text-brand-accent" />
              <h3 className="mt-3 text-[15px] font-bold text-brand-dark">
                Téléphone
              </h3>
              <p className="mt-1 text-[18px] font-semibold text-brand-dark">
                {help.contact.phone}
              </p>
            </a>
          </RevealItem>
          <RevealItem>
            <a
              href={`mailto:${help.contact.email}`}
              className="block h-full rounded-2xl border border-brand-border bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <Icon name="share" className="text-brand-accent" />
              <h3 className="mt-3 text-[15px] font-bold text-brand-dark">E-mail</h3>
              <p className="mt-1 text-[16px] font-semibold text-brand-dark">
                {help.contact.email}
              </p>
            </a>
          </RevealItem>
          <RevealItem>
            <div className="h-full rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
              <Icon name="pin" className="text-brand-accent" />
              <h3 className="mt-3 text-[15px] font-bold text-brand-dark">Adresse</h3>
              <p className="mt-1 text-[14px] text-slate-600">
                {help.contact.address}
              </p>
            </div>
          </RevealItem>
        </RevealGroup>
      </section>

      <FaqSection
        items={help.faq}
        title="Questions fréquentes"
        intro="Les réponses les plus demandées avant et après une course."
        showMoreHref={null}
        divider
      />

      <section id="contact" className="mx-auto max-w-3xl px-6 py-10">
        <Reveal className="rounded-[28px] border border-brand-border bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-[24px] font-bold text-brand-dark">Nous écrire</h2>
          <form className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <label className="block text-[13px] font-medium text-slate-700 sm:col-span-1">
              Nom et prénom
              <input
                name="name"
                required
                className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 py-2.5 text-[14px] outline-none ring-brand-yellow focus:ring-2"
              />
            </label>
            <label className="block text-[13px] font-medium text-slate-700">
              Téléphone
              <input
                name="phone"
                required
                className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 py-2.5 text-[14px] outline-none ring-brand-yellow focus:ring-2"
              />
            </label>
            <label className="block text-[13px] font-medium text-slate-700 sm:col-span-2">
              E-mail
              <input
                name="email"
                type="email"
                required
                className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 py-2.5 text-[14px] outline-none ring-brand-yellow focus:ring-2"
              />
            </label>
            <label className="block text-[13px] font-medium text-slate-700 sm:col-span-2">
              Objet
              <select
                name="subject"
                required
                className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 py-2.5 text-[14px] outline-none ring-brand-yellow focus:ring-2"
                defaultValue=""
              >
                <option value="" disabled>
                  Choisir un objet
                </option>
                {help.form.subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[13px] font-medium text-slate-700">
              Référence de course
              <input
                name="ref"
                className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 py-2.5 text-[14px] outline-none ring-brand-yellow focus:ring-2"
              />
            </label>
            <label className="block text-[13px] font-medium text-slate-700">
              Date du trajet
              <input
                name="date"
                type="date"
                className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 py-2.5 text-[14px] outline-none ring-brand-yellow focus:ring-2"
              />
            </label>
            <label className="block text-[13px] font-medium text-slate-700 sm:col-span-2">
              Message
              <textarea
                name="message"
                rows={5}
                required
                className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 py-2.5 text-[14px] outline-none ring-brand-yellow focus:ring-2"
              />
            </label>
            <label className="flex items-start gap-2 text-[12px] text-slate-600 sm:col-span-2">
              <input type="checkbox" required className="mt-1" />
              J’accepte que mes données soient utilisées pour traiter ma demande,
              conformément à la politique de confidentialité.
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-yellow px-6 py-3.5 text-[14px] font-bold text-brand-charcoal sm:col-span-2"
            >
              {help.form.cta}
              <Icon name="arrow" />
            </button>
          </form>
        </Reveal>
      </section>

      <section id="application" className="mx-auto mb-20 max-w-7xl px-6">
        <Reveal className="rounded-[28px] border border-brand-border bg-brand-surface p-8 text-center">
          <h2 className="text-[22px] font-bold text-brand-dark">
            Assistance application
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[14px] text-slate-600">
            Un souci avec l’app ? Appelez le {site.phoneDisplay} ou consultez la
            page application.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href={site.phoneHref}
              className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-5 py-3 text-[13px] font-semibold text-white"
            >
              <Icon name="phone" className="text-brand-yellow" />
              Appeler
            </a>
            <a
              href="/application"
              className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-5 py-3 text-[13px] font-semibold text-brand-dark"
            >
              Voir l’application
            </a>
          </div>
        </Reveal>
      </section>
    </>
  );
}
