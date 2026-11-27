import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "../../../lib/auth-session";
import { createAuthClient, type DemandeOut } from "@mbt/api-client/auth";

export const metadata: Metadata = {
  title: "Mes demandes — MBT Taxis",
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
  accepted: "bg-green-100 text-green-800",
  refused: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-soft text-body",
};

const SERVICE_LABELS: Record<string, string> = {
  pmr: "Taxi PMR",
  vsl: "Transport VSL",
  daily: "Taxi quotidien",
  business: "Taxi entreprise",
};

function DemandeCard({ demande }: { demande: DemandeOut }) {
  const statusLabel = STATUS_LABELS[demande.status] ?? demande.status;
  const statusColor = STATUS_COLORS[demande.status] ?? "bg-soft text-body";
  const serviceLabel = SERVICE_LABELS[demande.service] ?? demande.service;
  const pickupAddress = (demande.pickup_address as { formatted?: string }).formatted ?? "—";
  const dropoffAddress = (demande.dropoff_address as { formatted?: string }).formatted ?? "—";

  const pickupDate = new Date(demande.pickup_at);
  const dateStr = pickupDate.toLocaleDateString("fr-BE", {
    weekday: "long",
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
      className="block rounded-2xl border border-border bg-white p-5 shadow-sm hover:border-brand transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xs font-mono text-body/60">{demande.reference}</span>
          <p className="font-semibold text-ink">{serviceLabel}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
      <div className="text-sm text-body space-y-1">
        <p>
          <i className="fa fa-calendar-o mr-2 text-brand" aria-hidden />
          {dateStr} à {timeStr}
        </p>
        <p className="truncate">
          <i className="fa fa-map-marker mr-2 text-brand" aria-hidden />
          {pickupAddress}
        </p>
        <p className="truncate">
          <i className="fa fa-flag-o mr-2 text-brand" aria-hidden />
          {dropoffAddress}
        </p>
      </div>
      <p className="mt-3 text-xs text-brand font-medium">
        Voir les détails →
      </p>
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
    <section className="bg-soft min-h-screen pt-36 pb-20">
      <div className="container-mbt max-w-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/compte" className="text-sm text-brand hover:underline">
            ← Mon compte
          </Link>
        </div>
        <h1 className="text-ink mb-6">Mes demandes</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Link
            href="/compte/demandes?scope=upcoming"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              scope === "upcoming" ? "bg-brand text-white" : "bg-white border border-border text-body hover:border-brand"
            }`}
          >
            À venir
          </Link>
          <Link
            href="/compte/demandes?scope=past"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              scope === "past" ? "bg-brand text-white" : "bg-white border border-border text-body hover:border-brand"
            }`}
          >
            Passées
          </Link>
        </div>

        {!result.ok ? (
          <div className="rounded-2xl border border-border bg-white p-8 text-center text-body">
            <p>Impossible de charger vos demandes. Veuillez réessayer.</p>
          </div>
        ) : result.data.items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-8 text-center">
            <p className="text-body mb-4">
              {scope === "upcoming"
                ? "Vous n'avez pas de réservation à venir."
                : "Aucune réservation passée."}
            </p>
            {scope === "upcoming" && (
              <Link href="/reservation" className="btn btn-primary">
                Réserver maintenant
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
                  className="btn btn-secondary"
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
