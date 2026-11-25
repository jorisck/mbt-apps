"use client";

import { organisations } from "../../../content/pages";
import { site } from "../../../content/site";
import { FaqSection } from "../../components/FaqSection";
import { Icon } from "../../components/Icon";
import { PageHero } from "../../components/PageHero";
import { Reveal, RevealGroup, RevealItem } from "../../components/Reveal";
import { SectionDivider } from "../../components/SectionDivider";

export default function OrganisationsPage() {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    form.reset();
    alert("Merci. Votre demande a bien été enregistrée (démo).");
  }

  return (
    <>
      <PageHero
        eyebrow={organisations.hero.eyebrow}
        title={organisations.hero.title}
        body={organisations.hero.body}
        primaryHref="/aide#contact"
        primaryLabel="Parler à notre équipe"
        primaryExternal={false}
        secondaryHref="#formulaire"
        secondaryLabel="Demander une information professionnelle"
      />

      <SectionDivider variant="glow" />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <Reveal>
          <h2 className="mb-6 text-[24px] font-bold text-brand-dark">
            Organisations concernées
          </h2>
        </Reveal>
        <RevealGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {organisations.audiences.map((item) => (
            <RevealItem key={item}>
              <div className="rounded-xl border border-brand-border bg-white px-4 py-3 text-[13px] font-medium capitalize text-slate-700 shadow-sm">
                {item}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <SectionDivider variant="steps" />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <RevealGroup className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {organisations.needs.map((need) => (
            <RevealItem key={need.title}>
              <div className="h-full rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
                <h3 className="text-[17px] font-bold text-brand-dark">
                  {need.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
                  {need.body}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <SectionDivider />

      <section id="formulaire" className="mx-auto max-w-3xl px-6 py-10">
        <Reveal className="rounded-[28px] border border-brand-border bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-[24px] font-bold text-brand-dark">
            {organisations.form.title}
          </h2>
          <form className="mt-6 grid grid-cols-1 gap-4" onSubmit={onSubmit}>
            {organisations.form.fields.map((field) => {
              const isMessage = field === "Message";
              const id = field.toLowerCase().replace(/\s+/g, "-");
              return (
                <label key={field} className="block text-[13px] font-medium text-slate-700">
                  {field}
                  {isMessage ? (
                    <textarea
                      id={id}
                      name={id}
                      rows={4}
                      required
                      className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 py-2.5 text-[14px] outline-none ring-brand-yellow focus:ring-2"
                    />
                  ) : (
                    <input
                      id={id}
                      name={id}
                      type={field.includes("E-mail") ? "email" : "text"}
                      required={
                        field === "Nom de l’organisation" ||
                        field === "Personne de contact" ||
                        field === "E-mail professionnel"
                      }
                      className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 py-2.5 text-[14px] outline-none ring-brand-yellow focus:ring-2"
                    />
                  )}
                </label>
              );
            })}
            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand-yellow px-6 py-3.5 text-[14px] font-bold text-brand-charcoal"
            >
              {organisations.form.cta}
              <Icon name="arrow" />
            </button>
          </form>
        </Reveal>
      </section>

      <FaqSection
        items={organisations.faq.items}
        title={organisations.faq.title}
        intro={organisations.faq.intro}
      />

      <section className="mx-auto mb-20 max-w-7xl px-6 py-6">
        <Reveal y={48} className="relative overflow-hidden rounded-[32px] bg-brand-dark p-8 text-white sm:p-12">
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-brand-yellow/10 blur-[90px]" />
          <h2 className="relative z-10 text-[28px] font-bold sm:text-[34px]">
            {organisations.cta.title}
          </h2>
          <div className="relative z-10 mt-6 flex flex-wrap gap-3">
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[14px] font-bold text-brand-charcoal"
            >
              {organisations.cta.primary}
              <Icon name="arrow" />
            </a>
            <a
              href={site.phoneHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-[14px] font-medium text-white"
            >
              <Icon name="phone" className="text-brand-yellow" />
              {organisations.cta.secondary}
            </a>
          </div>
        </Reveal>
      </section>
    </>
  );
}
