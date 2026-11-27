import type { Metadata } from "next";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe — MBT Taxis",
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <section className="bg-soft min-h-screen pt-36 pb-20">
        <div className="container-mbt max-w-md text-center">
          <h1 className="text-ink mb-4">Lien invalide</h1>
          <p className="text-body mb-6">
            Ce lien de réinitialisation est manquant ou invalide.
          </p>
          <a href="/compte/mot-de-passe-oublie" className="btn btn-primary">
            Demander un nouveau lien
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-soft min-h-screen pt-36 pb-20">
      <div className="container-mbt max-w-md">
        <h1 className="text-ink mb-2">Nouveau mot de passe</h1>
        <p className="text-body mb-8">Choisissez un nouveau mot de passe pour votre compte.</p>
        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          <ResetForm token={token} />
        </div>
      </div>
    </section>
  );
}
