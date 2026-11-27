import type { Metadata } from "next";
import { DemandeForm } from "../../components/DemandeForm";

export const metadata: Metadata = {
  title: "Demande de taxi PMR — Handycab",
  description:
    "Remplissez notre formulaire pour réserver un taxi adapté PMR à Bruxelles. Véhicule accessible, chauffeur formé, tarif réglementé.",
  robots: { index: true, follow: true },
};

export default function DemandePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20 pt-32 md:pt-40">
      {/* Page intro */}
      <div className="mb-10 max-w-2xl">
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Réservation en ligne
        </span>
        <h1 className="font-display text-[32px] font-extrabold tracking-tight text-brand-dark sm:text-[42px]">
          Réserver un taxi adapté PMR
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-slate-600">
          Remplissez le formulaire ci-dessous. Notre équipe vous confirme la course et peut répondre
          à toutes vos questions spécifiques.
        </p>

        {/* Quick trust badges */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            "Véhicule accessible homologué RBC",
            "Chauffeur formé PMR",
            "Tarif conventionné — éligible mutuelle",
          ].map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-yellow" />
              {badge}
            </span>
          ))}
        </div>
      </div>

      <DemandeForm />

      {/* Alternative channels */}
      <div className="mt-8 rounded-2xl border border-brand-border bg-brand-surface p-5">
        <p className="text-[13px] text-slate-600">
          <span className="font-semibold text-brand-dark">Préférez-vous nous appeler ? </span>
          Notre ligne dédiée PMR est disponible du lundi au vendredi de 8h à 18h :{" "}
          <a
            href="tel:+3223153100"
            className="font-semibold text-brand-accent hover:underline"
          >
            02 315 31 00
          </a>
          .
        </p>
      </div>
    </main>
  );
}
