import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Protection des données (RGPD)",
};

export default function CookiePolicyPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 pb-20 pt-32">
      <h1 className="font-display text-3xl font-bold text-brand-dark">
        Protection des données (RGPD)
      </h1>
      <p className="mt-4 text-slate-600">
        Contenu juridique à compléter. HandyCab / MBT Taxis SRL traite les
        données de réservation conformément au RGPD. Pour toute demande :
        pmr@mbt.be.
      </p>
    </section>
  );
}
