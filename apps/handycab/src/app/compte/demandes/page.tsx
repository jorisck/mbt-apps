import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "../../../lib/auth-session";
import { createAuthClient, type DemandeOut } from "@mbt/api-client/auth";

export const metadata: Metadata = {
  title: "Mes demandes — Handycab",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  refused: "Refusée",
  cancelled: "Annulée",
  in_progress: "En cours",
  completed: "Terminée",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-700",
  refused: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-brand-surface text-brand-muted",
};

const SERVICE_LABELS: Record<string, string> = {
  pmr: "Taxi PMR",
  vsl: "Transport VSL",
  daily: "Taxi quotidien",
  business: "Taxi entreprise",
};

function DemandeCard({ demande }: { demande: DemandeOut }) {
  const statusLabel = STATUS_LABELS[demande.status] ?? demande.status;
  const statusColor = STATUS_COLORS[demande.status] ?? "bg-brand-surface text-brand-muted";
  const serviceLabel = SERVICE_LABELS[demande.service] ?? demande.service;
  const pickupAddress = (demande.pickup_address as { formatted?: string }).formatted ?? "—";
  const dropoffAddress = (demande.dropoff_address as { formatted?: string }).formatted ?? "—";

  const pickupDate = new Date(demande.pickup_at);
  const dateStr = pickupDate.toLocaleDateString("fr-BE", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = pickupDate.toLocaleTimeString("fr-BE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/compte/demandes/${demande.id}`}
      className="block rounded-[24px] border border-brand-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-dark"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-[11px] font-mono text-brand-muted">{demande.reference}</span>
          <p className="text-[15px] font-bold text-brand-dark">{serviceLabel}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
      <div className="space-y-1 text-[13px] text-brand-muted">
        <p>
          <i className="fa fa-calendar mr-2 text-brand-yellow" aria-hidden />
          {dateStr} à {timeStr}
        </p>
        <p className="truncate">
          <i className="fa fa-map-marker mr-2 text-brand-yellow" aria-hidden />
          {pickupAddress}
        </p>
        <p className="truncate">
          <i className="fa fa-flag-o mr-2 text-brand-yellow" aria-hidden />
          {dropoffAddress}
        </p>
      </div>
      <p className="mt-3 text-[12px] font-semibold text-brand-accent">Voir les détails →</p>
    </Link>
  );
}

interface Props {
  searchParams: Promise<{ scope?: string; cursor?: string }>;
}

export default async function DemandesPage({ searchParams }: Props) {
  const { scope: rawScope, cursor } = await searchParams;
  const scope = rawScope === "past" ? "past" : "upcoming";
  const { accessToken } = await requireAuth();

  const client = createAuthClient({
    baseUrl: process.env.API_URL ?? "http://api.localhost:8000",
    apiKey: process.env.API_BFF_KEY,
  });

  const result = await client.listDemandes(accessToken, { scope, cursor, limit: 20 });

  return (
    <section className="min-h-screen bg-brand-surface pt-36 pb-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mb-2">
          <Link href="/compte" className="text-[13px] text-brand-accent hover:underline">
            ← Mon compte
          </Link>
        </div>
        <h1 className="text-[28px] font-bold text-brand-dark mb-6">Mes demandes</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Link
            href="/compte/demandes?scope=upcoming"
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
              scope === "upcoming"
                ? "bg-brand-dark text-white"
                : "border border-brand-border bg-white text-brand-dark hover:border-brand-dark"
            }`}
          >
            À venir
          </Link>
          <Link
            href="/compte/demandes?scope=past"
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
              scope === "past"
                ? "bg-brand-dark text-white"
                : "border border-brand-border bg-white text-brand-dark hover:border-brand-dark"
            }`}
          >
            Passées
          </Link>
        </div>

        {!result.ok ? (
          <div className="rounded-[24px] border border-brand-border bg-white p-8 text-center text-brand-muted">
            Impossible de charger vos demandes. Veuillez réessayer.
          </div>
        ) : result.data.items.length === 0 ? (
          <div className="rounded-[24px] border border-brand-border bg-white p-10 text-center">
            <p className="text-brand-muted mb-4">
              {scope === "upcoming"
                ? "Vous n'avez pas de réservation à venir."
                : "Aucune réservation passée."}
            </p>
            {scope === "upcoming" && (
              <Link
                href="/demande"
                className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[14px] font-bold text-brand-charcoal hover:bg-brand-yellow-dark transition-colors"
              >
                Faire une demande
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {result.data.items.map((d) => (
                <DemandeCard key={d.id} demande={d} />
              ))}
            </div>

            {result.data.next_cursor && (
              <div className="mt-6 text-center">
                <Link
                  href={`/compte/demandes?scope=${scope}&cursor=${result.data.next_cursor}`}
                  className="rounded-full border border-brand-border bg-white px-6 py-3 text-[13px] font-semibold text-brand-dark hover:border-brand-dark transition-colors"
                >
                  Charger la suite
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
