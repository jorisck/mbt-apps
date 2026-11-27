import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "../../../../lib/auth-session";
import { createAuthClient, type DemandeOut } from "@mbt/api-client/auth";

export const metadata: Metadata = {
  title: "Détail de la demande — MBT Taxis",
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
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  refused: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-soft text-body border-border",
};

const SERVICE_LABELS: Record<string, string> = {
  pmr: "Taxi PMR",
  vsl: "Transport VSL",
  daily: "Taxi quotidien",
  business: "Taxi entreprise",
};

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-border last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-body/60">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

function formatDateTime(isoStr: string | null | undefined): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleString("fr-BE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DemandePage({ params }: Props) {
  const { id } = await params;
  const { accessToken } = await requireAuth();

  const client = createAuthClient({
    baseUrl: process.env.API_URL ?? "http://api.localhost:8000",
    apiKey: process.env.API_BFF_KEY,
  });

  const result = await client.getDemande(accessToken, id);

  if (!result.ok) {
    return (
      <section className="bg-soft min-h-screen pt-36 pb-20">
        <div className="container-mbt max-w-2xl text-center">
          <h1 className="text-ink mb-4">Demande introuvable</h1>
          <p className="text-body mb-6">Cette demande n'existe pas ou ne vous appartient pas.</p>
          <Link href="/compte/demandes" className="btn btn-primary">
            Mes demandes
          </Link>
        </div>
      </section>
    );
  }

  const d: DemandeOut = result.data;
  const statusLabel = STATUS_LABELS[d.status] ?? d.status;
  const statusColor = STATUS_COLORS[d.status] ?? "bg-soft text-body border-border";
  const serviceLabel = SERVICE_LABELS[d.service] ?? d.service;
  const pickupAddress = (d.pickup_address as { formatted?: string }).formatted ?? "—";
  const dropoffAddress = (d.dropoff_address as { formatted?: string }).formatted ?? "—";

  const canCancel = d.status === "pending" || d.status === "accepted";

  return (
    <section className="bg-soft min-h-screen pt-36 pb-20">
      <div className="container-mbt max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/compte/demandes" className="text-sm text-brand hover:underline">
            ← Mes demandes
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-mono text-body/60">{d.reference}</span>
            <h1 className="text-ink">{serviceLabel}</h1>
          </div>
          <span className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Trajet */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm mb-4">
          <h2 className="text-base font-semibold text-ink mb-2">Trajet</h2>
          <InfoRow label="Départ prévu" value={formatDateTime(d.pickup_at)} />
          <InfoRow label="Adresse de départ" value={pickupAddress} />
          <InfoRow label="Destination" value={dropoffAddress} />
          {d.return_at && (
            <InfoRow label="Retour prévu" value={formatDateTime(d.return_at)} />
          )}
          <InfoRow label="Nombre de passagers" value={String(d.passenger_count)} />
        </div>

        {/* Motif refus/annulation */}
        {d.refusal_reason && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 mb-4">
            <p className="text-sm font-semibold text-red-700 mb-1">Motif de refus</p>
            <p className="text-sm text-red-600">{d.refusal_reason}</p>
          </div>
        )}
        {d.cancellation_reason && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">Motif d'annulation</p>
            <p className="text-sm text-gray-600">{d.cancellation_reason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Link href="/reservation" className="btn btn-primary">
            Nouvelle réservation
          </Link>
          {canCancel && (
            <Link
              href={`/compte/demandes/${d.id}/annuler`}
              className="btn btn-secondary"
            >
              Annuler cette demande
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
