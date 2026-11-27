import type { Metadata } from "next";
import Link from "next/link";
import { createAuthClient } from "@mbt/api-client/auth";

export const metadata: Metadata = {
  title: "Vérification e-mail — Handycab",
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifierPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <section className="min-h-screen bg-brand-surface pt-36 pb-20">
        <div className="mx-auto max-w-md px-4 sm:px-6 text-center">
          <h1 className="text-[28px] font-bold text-brand-dark mb-4">Lien invalide</h1>
          <p className="text-brand-muted mb-6">Ce lien de vérification est manquant.</p>
          <Link
            href="/compte/inscription"
            className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[14px] font-bold text-brand-charcoal hover:bg-brand-yellow-dark transition-colors"
          >
            Retour à l'inscription
          </Link>
        </div>
      </section>
    );
  }

  const client = createAuthClient({
    baseUrl: process.env.API_URL ?? "http://api.localhost:8000",
    apiKey: process.env.API_BFF_KEY,
  });
  const result = await client.verifyEmail(token);

  if (!result.ok) {
    return (
      <section className="min-h-screen bg-brand-surface pt-36 pb-20">
        <div className="mx-auto max-w-md px-4 sm:px-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <i className="fa fa-times text-2xl text-red-600" aria-hidden />
          </div>
          <h1 className="text-[28px] font-bold text-brand-dark mb-4">Vérification échouée</h1>
          <p className="text-brand-muted mb-6">{result.error.detail}</p>
          <Link
            href="/compte/inscription"
            className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[14px] font-bold text-brand-charcoal hover:bg-brand-yellow-dark transition-colors"
          >
            Retour à l'inscription
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-brand-surface pt-36 pb-20">
      <div className="mx-auto max-w-md px-4 sm:px-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <i className="fa fa-check text-2xl text-emerald-600" aria-hidden />
        </div>
        <h1 className="text-[28px] font-bold text-brand-dark mb-4">E-mail vérifié !</h1>
        <p className="text-brand-muted mb-6">{result.data.message}</p>
        <Link
          href="/compte/connexion"
          className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[14px] font-bold text-brand-charcoal hover:bg-brand-yellow-dark transition-colors"
        >
          Se connecter
        </Link>
      </div>
    </section>
  );
}
