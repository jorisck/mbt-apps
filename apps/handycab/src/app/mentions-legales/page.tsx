import type { Metadata } from "next";
import { site } from "../../../content/site";

export const metadata: Metadata = {
  title: "Mentions légales",
};

export default function MentionsLegalesPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 pb-20 pt-32">
      <h1 className="font-display text-3xl font-bold text-brand-dark">
        Mentions légales
      </h1>
      <div className="mt-6 space-y-4 text-slate-600">
        <p>
          HandyCab est une marque exploitée par <strong>MBT Taxis SRL</strong>.
        </p>
        <p>
          Siège : {site.address.street}, {site.address.postalCode}{" "}
          {site.address.city}.
        </p>
        <p>
          Contact :{" "}
          <a className="text-brand-accent underline" href={site.phoneHref}>
            {site.phone}
          </a>{" "}
          — {site.email}
        </p>
      </div>
    </section>
  );
}
