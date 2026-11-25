import type { Metadata } from "next";
import { site } from "../../../content/site";
import { FaqSection } from "../../components/FaqSection";

export const metadata: Metadata = {
  title: "Mentions légales",
};

const mentionsFaq = [
  {
    q: "Qui édite le service Handycab ?",
    a: "Handycab est une plateforme de mise en relation pour la réservation de taxis adaptés (PMR) à Bruxelles, développée dans l’écosystème de MBT.",
  },
  {
    q: "Handycab est-il le transporteur de la course ?",
    a: "Non. Handycab agit comme une interface de mise en relation entre l’usager et le chauffeur qui réalise la course.",
  },
  {
    q: "Où consulter les conditions générales ?",
    a: "Les conditions générales de réservation sont disponibles sur la plateforme de booking Handycab, via le lien Conditions générales du site.",
  },
  {
    q: "Comment contacter Handycab ?",
    a: `Par téléphone au ${site.phoneDisplay} ou par e-mail à ${site.email}.`,
  },
] as const;

export default function MentionsLegalesPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 pb-20 pt-40 md:pt-44">
      <h1 className="font-display text-3xl font-bold text-brand-dark">
        Mentions légales
      </h1>
      <div className="mt-6 space-y-4 text-slate-600">
        <p>
          Handycab est une plateforme de mise en relation pour la réservation de
          taxis adaptés (PMR) à Bruxelles, développée dans l’écosystème de{" "}
          <strong>MBT</strong>.
        </p>
        <p>
          Siège mentionné : {site.address.street}, {site.address.postalCode}{" "}
          {site.address.city}.
        </p>
        <p>
          Contact :{" "}
          <a className="text-brand-accent underline" href={site.phoneHref}>
            {site.phoneDisplay}
          </a>{" "}
          —{" "}
          <a
            className="text-brand-accent underline"
            href={`mailto:${site.email}`}
          >
            {site.email}
          </a>
        </p>
        <p className="text-[14px]">
          Le service Handycab agit comme une interface de mise en relation entre
          l’usager et le chauffeur qui réalise la course. Consultez les{" "}
          <a
            className="text-brand-accent underline"
            href={site.conditionsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            conditions générales
          </a>{" "}
          pour plus de détails.
        </p>
      </div>

      <FaqSection
        items={mentionsFaq}
        title="FAQ — Mentions légales"
        intro="Précisions utiles sur l’éditeur et le rôle de la plateforme."
        showMoreHref="/aide#faq"
      />
    </section>
  );
}
