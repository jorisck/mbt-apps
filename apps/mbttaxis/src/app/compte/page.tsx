import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "../../lib/auth-session";
import { logout } from "../actions/auth";

export const metadata: Metadata = {
  title: "Mon compte — MBT Taxis",
};

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-border last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-body/60">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

export default async function ComptePage() {
  const { profile } = await requireAuth();

  return (
    <section className="bg-soft min-h-screen pt-36 pb-20">
      <div className="container-mbt max-w-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold tracking-[0.12em] text-brand uppercase mb-1">
              Mon compte
            </p>
            <h1 className="text-ink">
              {profile.first_name} {profile.last_name}
            </h1>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="btn btn-secondary !px-4 !py-2 text-sm whitespace-nowrap"
            >
              Déconnexion
            </button>
          </form>
        </div>

        {/* Profile card */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm mb-6">
          <h2 className="text-base font-semibold text-ink mb-2">Informations personnelles</h2>
          {!profile.email_verified && (
            <p className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <i className="fa fa-exclamation-triangle mr-2" aria-hidden />
              Votre adresse e-mail n'a pas encore été vérifiée.
            </p>
          )}
          <ProfileRow label="Prénom" value={profile.first_name} />
          <ProfileRow label="Nom" value={profile.last_name} />
          <ProfileRow label="Adresse e-mail" value={profile.email} />
          <ProfileRow label="Téléphone" value={profile.phone} />
          <ProfileRow label="Langue" value={profile.language.toUpperCase()} />
        </div>

        {/* Quick links */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/compte/demandes"
            className="flex items-center gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm hover:border-brand transition-colors"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-soft">
              <i className="fa fa-list-alt text-brand text-xl" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-ink">Mes demandes</p>
              <p className="text-sm text-body">Consulter mes réservations</p>
            </div>
            <i className="fa fa-angle-right ml-auto text-body" aria-hidden />
          </Link>

          <Link
            href="/reservation"
            className="flex items-center gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm hover:border-brand transition-colors"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-soft">
              <i className="fa fa-taxi text-brand text-xl" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-ink">Nouvelle réservation</p>
              <p className="text-sm text-body">Réserver un trajet</p>
            </div>
            <i className="fa fa-angle-right ml-auto text-body" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
