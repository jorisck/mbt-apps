import type { Metadata } from "next";
import { contact } from "../../../content/contact";
import { Reveal } from "../../components/Reveal";
import { ContactForm } from "../../components/forms/ContactForm";

export const metadata: Metadata = {
  title: contact.meta.title,
  description: contact.meta.description,
};

export default function ContactPage() {
  return (
    <section className="bg-white pt-36 pb-24">
      <div className="container-mbt">
        <Reveal direction="up">
          <h1 className="text-ink">{contact.title}</h1>
        </Reveal>
        <div className="mt-12 grid gap-12 lg:grid-cols-2">
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
            <h2 className="mt-10 text-brand">{contact.hours.title}</h2>
            <p className="mt-3 text-body">{contact.hours.text}</p>
            <p className="mt-1 font-medium text-ink">{contact.hours.value}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
