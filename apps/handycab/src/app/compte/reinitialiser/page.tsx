import type { Metadata } from "next";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = {
  title: "Nouveau mot de passe — Handycab",
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <section className="min-h-screen bg-brand-surface pt-36 pb-20">
        <div className="mx-auto max-w-md px-4 sm:px-6 text-center">
          <h1 className="text-[28px] font-bold text-brand-dark mb-4">Lien invalide</h1>
          <p className="text-[15px] text-brand-muted mb-6">
            Ce lien de réinitialisation est manquant ou invalide.
          </p>
          <a
            href="/compte/mot-de-passe-oublie"
            className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[14px] font-bold text-brand-charcoal hover:bg-brand-yellow-dark transition-colors"
          >
            Demander un nouveau lien
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-brand-surface pt-36 pb-20">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <h1 className="text-[28px] font-bold text-brand-dark mb-2">Nouveau mot de passe</h1>
        <p className="text-[15px] text-brand-muted mb-8">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>
        <div className="rounded-[24px] border border-brand-border bg-white p-8 shadow-sm">
          <ResetForm token={token} />
        </div>
      </div>
    </section>
  );
}
