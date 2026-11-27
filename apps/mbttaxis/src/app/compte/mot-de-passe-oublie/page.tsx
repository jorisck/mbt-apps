import type { Metadata } from "next";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié — MBT Taxis",
};

export default function ForgotPasswordPage() {
  return (
    <section className="bg-soft min-h-screen pt-36 pb-20">
      <div className="container-mbt max-w-md">
        <h1 className="text-ink mb-2">Mot de passe oublié</h1>
        <p className="text-body mb-8">
          Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.
        </p>
        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          <ForgotForm />
        </div>
      </div>
    </section>
  );
}
