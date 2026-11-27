import type { Metadata } from "next";
import { ConnexionForm } from "./ConnexionForm";

export const metadata: Metadata = {
  title: "Connexion — MBT Taxis",
  description: "Accédez à votre espace passager MBT Taxis.",
};

export default function ConnexionPage() {
  return (
    <section className="bg-soft min-h-screen pt-36 pb-20">
      <div className="container-mbt max-w-md">
        <h1 className="text-ink mb-2">Connexion</h1>
        <p className="text-body mb-8">
          Pas encore de compte ?{" "}
          <a href="/compte/inscription" className="text-brand hover:underline">
            Créer un compte
          </a>
        </p>
        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          <ConnexionForm />
        </div>
      </div>
    </section>
  );
}
