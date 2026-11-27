import type { Metadata } from "next";
import { InscriptionForm } from "./InscriptionForm";

export const metadata: Metadata = {
  title: "Créer un compte — Handycab",
  description: "Créez votre compte Handycab pour gérer vos réservations de taxi adapté.",
};

export default function InscriptionPage() {
  return (
    <section className="min-h-screen bg-brand-surface pt-36 pb-20">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <h1 className="text-[28px] font-bold text-brand-dark mb-2">Créer un compte</h1>
        <p className="text-[15px] text-brand-muted mb-8">
          Déjà inscrit ?{" "}
          <a href="/compte/connexion" className="text-brand-accent hover:underline font-medium">
            Connectez-vous
          </a>
        </p>
        <div className="rounded-[24px] border border-brand-border bg-white p-8 shadow-sm">
          <InscriptionForm />
        </div>
      </div>
    </section>
  );
}
