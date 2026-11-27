import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "../../lib/auth-session";
import { logout } from "../actions/auth";

export const metadata: Metadata = {
  title: "Mon compte — Handycab",
};

export default async function ComptePage() {
  const { profile } = await requireAuth();

  return (
    <section className="min-h-screen bg-brand-surface pt-36 pb-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
              Mon compte
            </p>
            <h1 className="text-[28px] font-bold text-brand-dark">
              {profile.first_name} {profile.last_name}
            </h1>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-brand-border px-4 py-2 text-[13px] font-semibold text-brand-dark hover:bg-brand-dark hover:text-white transition-colors"
            >
              Déconnexion
            </button>
          </form>
        </div>

        {/* Profile card */}
        <div className="rounded-[24px] border border-brand-border bg-white p-6 shadow-sm mb-6">
          <h2 className="text-[16px] font-bold text-brand-dark mb-3">Informations personnelles</h2>

          {!profile.email_verified && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[13px] text-amber-800">
                <i className="fa fa-exclamation-triangle mr-2" aria-hidden />
                Votre adresse e-mail n'a pas encore été vérifiée.
              </p>
            </div>
          )}

          {[
            { label: "Prénom", value: profile.first_name },
            { label: "Nom", value: profile.last_name },
            { label: "E-mail", value: profile.email },
            { label: "Téléphone", value: profile.phone },
            { label: "Langue", value: profile.language.toUpperCase() },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-brand-border py-3 last:border-0"
            >
              <span className="text-[12px] font-semibold uppercase tracking-wider text-brand-muted">
                {label}
              </span>
              <span className="text-[14px] text-brand-dark">{value}</span>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/compte/demandes"
            className="flex items-center gap-4 rounded-[24px] border border-brand-border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-dark"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-surface">
              <i className="fa fa-list-alt text-[20px] text-brand-dark" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-brand-dark">Mes demandes</p>
              <p className="text-[13px] text-brand-muted">Consulter mes réservations</p>
            </div>
            <i className="fa fa-angle-right ml-auto text-brand-muted" aria-hidden />
          </Link>

          <Link
            href="/demande"
            className="flex items-center gap-4 rounded-[24px] border border-brand-border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-dark"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-yellow">
              <i className="fa fa-taxi text-[20px] text-brand-charcoal" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-brand-dark">Nouvelle demande</p>
              <p className="text-[13px] text-brand-muted">Réserver un taxi adapté</p>
            </div>
            <i className="fa fa-angle-right ml-auto text-brand-muted" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
