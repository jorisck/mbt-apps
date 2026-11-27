import type { Metadata } from "next";
import Link from "next/link";
import { createAuthClient } from "@mbt/api-client/auth";

export const metadata: Metadata = {
  title: "Vérification de l'adresse e-mail — MBT Taxis",
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifierPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <section className="bg-soft min-h-screen pt-36 pb-20">
        <div className="container-mbt max-w-md text-center">
          <h1 className="text-ink mb-4">Lien invalide</h1>
          <p className="text-body mb-6">Ce lien de vérification est manquant.</p>
          <Link href="/compte/inscription" className="btn btn-primary">
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
      <section className="bg-soft min-h-screen pt-36 pb-20">
        <div className="container-mbt max-w-md text-center">
          <i className="fa fa-times-circle mb-4 text-4xl text-red-500" aria-hidden />
          <h1 className="text-ink mb-4">Vérification échouée</h1>
          <p className="text-body mb-6">
            {result.error.detail}
          </p>
          <Link href="/compte/inscription" className="btn btn-primary">
            Retour à l'inscription
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-soft min-h-screen pt-36 pb-20">
      <div className="container-mbt max-w-md text-center">
        <i className="fa fa-check-circle mb-4 text-4xl text-brand" aria-hidden />
        <h1 className="text-ink mb-4">E-mail vérifié !</h1>
        <p className="text-body mb-6">{result.data.message}</p>
        <Link href="/compte/connexion" className="btn btn-primary">
          Se connecter
        </Link>
      </div>
    </section>
  );
}
