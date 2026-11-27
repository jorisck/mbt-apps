import type { Metadata } from "next";
import { InscriptionForm } from "./InscriptionForm";

export const metadata: Metadata = {
  title: "Créer un compte — MBT Taxis",
  description: "Créez votre compte passager MBT Taxis pour gérer vos réservations en ligne.",
};

export default function InscriptionPage() {
  return (
    <section className="bg-soft min-h-screen pt-36 pb-20">
      <div className="container-mbt max-w-md">
        <h1 className="text-ink mb-2">Créer un compte</h1>
        <p className="text-body mb-8">
          Déjà inscrit ?{" "}
          <a href="/compte/connexion" className="text-brand hover:underline">
            Connectez-vous
          </a>
        </p>
        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          <InscriptionForm />
        </div>
      </div>
    </section>
  );
}
