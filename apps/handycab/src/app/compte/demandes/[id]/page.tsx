import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "../../../../lib/auth-session";
import { createAuthClient, type DemandeOut } from "@mbt/api-client/auth";

export const metadata: Metadata = {
  title: "Détail de la demande — Handycab",
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

function formatDateTime(isoStr: string | null | undefined): string {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleString("fr-BE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-brand-border py-3 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
        {label}
      </span>
      <span className="text-[14px] text-brand-dark text-right">{value}</span>
    </div>
  );
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
      <section className="min-h-screen bg-brand-surface pt-36 pb-20">
        <div className="mx-auto max-w-md px-4 sm:px-6 text-center">
          <h1 className="text-[28px] font-bold text-brand-dark mb-4">Demande introuvable</h1>
          <p className="text-brand-muted mb-6">
            Cette demande n'existe pas ou ne vous appartient pas.
          </p>
          <Link
            href="/compte/demandes"
            className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[14px] font-bold text-brand-charcoal hover:bg-brand-yellow-dark transition-colors"
          >
            Mes demandes
          </Link>
        </div>
      </section>
    );
  }

  const d: DemandeOut = result.data;
  const statusLabel = STATUS_LABELS[d.status] ?? d.status;
  const statusColor = STATUS_COLORS[d.status] ?? "bg-brand-surface text-brand-muted";
  const serviceLabel = SERVICE_LABELS[d.service] ?? d.service;
  const pickupAddress = (d.pickup_address as { formatted?: string }).formatted ?? "—";
  const dropoffAddress = (d.dropoff_address as { formatted?: string }).formatted ?? "—";
  const canCancel = d.status === "pending" || d.status === "accepted";

  return (
    <section className="min-h-screen bg-brand-surface pt-36 pb-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mb-6">
          <Link href="/compte/demandes" className="text-[13px] text-brand-accent hover:underline">
            ← Mes demandes
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-mono text-brand-muted">{d.reference}</span>
            <h1 className="text-[28px] font-bold text-brand-dark">{serviceLabel}</h1>
          </div>
          <span className={`shrink-0 rounded-full px-4 py-1.5 text-[12px] font-bold ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Trajet */}
        <div className="rounded-[24px] border border-brand-border bg-white p-6 shadow-sm mb-4">
          <h2 className="text-[15px] font-bold text-brand-dark mb-2">Trajet</h2>
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
          <div className="mb-4 rounded-[20px] border border-red-200 bg-red-50 p-5">
            <p className="text-[13px] font-bold text-red-700 mb-1">Motif de refus</p>
            <p className="text-[13px] text-red-600">{d.refusal_reason}</p>
          </div>
        )}
        {d.cancellation_reason && (
          <div className="mb-4 rounded-[20px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-[13px] font-bold text-slate-700 mb-1">Motif d'annulation</p>
            <p className="text-[13px] text-slate-600">{d.cancellation_reason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/demande"
            className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[14px] font-bold text-brand-charcoal hover:bg-brand-yellow-dark transition-colors"
          >
            Nouvelle demande
          </Link>
          {canCancel && (
            <Link
              href={`/compte/demandes/${d.id}/annuler`}
              className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-6 py-3 text-[14px] font-semibold text-brand-dark hover:border-brand-dark transition-colors"
            >
              Annuler cette demande
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
