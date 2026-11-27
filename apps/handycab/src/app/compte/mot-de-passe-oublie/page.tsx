import type { Metadata } from "next";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié — Handycab",
};

export default function ForgotPasswordPage() {
  return (
    <section className="min-h-screen bg-brand-surface pt-36 pb-20">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <h1 className="text-[28px] font-bold text-brand-dark mb-2">Mot de passe oublié</h1>
        <p className="text-[15px] text-brand-muted mb-8">
          Saisissez votre e-mail pour recevoir un lien de réinitialisation.
        </p>
        <div className="rounded-[24px] border border-brand-border bg-white p-8 shadow-sm">
          <ForgotForm />
        </div>
      </div>
    </section>
  );
}
