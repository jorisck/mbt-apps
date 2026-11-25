import type { Metadata } from "next";
import Link from "next/link";
import { contact } from "../../../content/contact";
import { Reveal } from "../../components/Reveal";
import { ContactForm } from "../../components/forms/ContactForm";

export const metadata: Metadata = {
  title: contact.meta.title,
  description: contact.meta.description,
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-soft pt-36 pb-12">
        <div className="container-mbt max-w-3xl">
          <Reveal direction="up">
            <p className="text-sm font-semibold tracking-[0.12em] text-brand uppercase">
              {contact.hero.eyebrow}
            </p>
            <h1 className="mt-3 text-ink">{contact.hero.title}</h1>
            <p className="mt-4 text-body">{contact.hero.text}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={contact.hero.primaryHref} className="btn btn-primary">
                {contact.hero.primaryCta}
              </a>
              <a href={contact.hero.secondaryHref} className="btn btn-secondary">
                {contact.hero.secondaryCta}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white pb-24 pt-12">
        <div className="container-mbt">
          <div className="grid gap-12 lg:grid-cols-2">
            <Reveal direction="left">
              <h2 className="text-brand">{contact.form.title}</h2>
              <p className="mt-3 mb-8 text-body">{contact.form.intro}</p>
              <ContactForm />
            </Reveal>
            <Reveal direction="right" delay={0.12}>
              <h2 className="text-brand">{contact.details.title}</h2>
              <ul className="mt-6 space-y-4 text-body">
                <li>
                  <i className="fa fa-map-marker mr-2 text-brand" aria-hidden />
                  {contact.details.address}
                </li>
                <li>
                  <i className="fa fa-phone mr-2 text-brand" aria-hidden />
                  <a href={contact.details.phoneHref}>{contact.details.phone}</a>
                </li>
                <li>
                  <i className="fa fa-envelope-o mr-2 text-brand" aria-hidden />
                  <a href={`mailto:${contact.details.email}`}>{contact.details.email}</a>
                </li>
              </ul>
              <Link
                href={contact.details.mapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary mt-6"
              >
                {contact.details.mapCta}
              </Link>
              <h2 className="mt-10 text-brand">{contact.hours.title}</h2>
              {contact.hours.valueLines.map((line) => (
                <p key={line} className="mt-1 font-medium text-ink">
                  {line}
                </p>
              ))}
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
