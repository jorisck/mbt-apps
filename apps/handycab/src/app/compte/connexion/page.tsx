import type { Metadata } from "next";
import { ConnexionForm } from "./ConnexionForm";

export const metadata: Metadata = {
  title: "Connexion — Handycab",
  description: "Accédez à votre espace Handycab.",
};

export default function ConnexionPage() {
  return (
    <section className="min-h-screen bg-brand-surface pt-36 pb-20">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <h1 className="text-[28px] font-bold text-brand-dark mb-2">Connexion</h1>
        <p className="text-[15px] text-brand-muted mb-8">
          Pas encore de compte ?{" "}
          <a href="/compte/inscription" className="text-brand-accent hover:underline font-medium">
            Créer un compte
          </a>
        </p>
        <div className="rounded-[24px] border border-brand-border bg-white p-8 shadow-sm">
          <ConnexionForm />
        </div>
      </div>
    </section>
  );
}
