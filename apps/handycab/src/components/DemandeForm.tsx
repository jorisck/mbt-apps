"use client";

import { useActionState, useRef, useState } from "react";
import { submitDemande, type FormState } from "../app/actions/demande";
import { Icon } from "./Icon";

/* ─── Constants ──────────────────────────────────────────────── */
const MOBILITY_OPTIONS = [
  { value: "none", label: "Aucune aide à la mobilité" },
  { value: "walking_aid", label: "Aide à la marche (canne, déambulateur…)" },
  { value: "manual_wheelchair", label: "Fauteuil roulant manuel" },
  { value: "electric_wheelchair", label: "Fauteuil roulant électrique" },
  { value: "other", label: "Autre aide à préciser" },
] as const;

const inputClass =
  "h-12 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 text-[14px] text-brand-dark transition-all placeholder:text-slate-400 focus:border-brand-dark focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,205,26,0.25)]";

const errorClass = "mt-1 text-[12px] text-red-600";

const selectClass =
  "h-12 w-full appearance-none rounded-xl border border-brand-border bg-brand-surface px-3.5 text-[14px] text-brand-dark transition-all focus:border-brand-dark focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,205,26,0.25)]";

/* ─── Helper ──────────────────────────────────────────────────── */
function FieldLabel({
  icon,
  iconClass,
  label,
  required,
}: {
  icon: "origin" | "pin" | "calendar" | "clock" | "user" | "phone" | "accessible";
  iconClass: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
      <Icon name={icon} className={`text-[13px] ${iconClass}`} />
      <span>{label}</span>
      {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field];
  if (!msgs?.length) return null;
  return <p className={errorClass}>{msgs[0]}</p>;
}

/* ─── Success banner ──────────────────────────────────────────── */
function SuccessBanner() {
  return (
    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
        <Icon name="check" className="text-[24px] text-emerald-600" />
      </div>
      <h3 className="text-[20px] font-bold text-brand-dark">Demande envoyée !</h3>
      <p className="mt-2 text-[15px] text-slate-600">
        Votre demande de taxi adapté a bien été transmise. Notre équipe vous contactera rapidement
        pour confirmer votre réservation.
      </p>
      <p className="mt-4 text-[13px] text-slate-500">
        Une confirmation vous sera envoyée par e-mail.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[14px] font-bold text-brand-charcoal shadow-[0_4px_16px_rgba(249,205,26,0.35)] transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-dark"
      >
        <span>Retour à l&apos;accueil</span>
        <Icon name="arrow" className="text-[12px]" />
      </a>
    </div>
  );
}

/* ─── Main form ───────────────────────────────────────────────── */
export function DemandeForm() {
  const initialState: FormState = { ok: false };
  const [state, formAction, pending] = useActionState(submitDemande, initialState);

  const startRef = useRef<number>(Date.now());
  const elapsedRef = useRef<HTMLInputElement>(null);
  const [idKey] = useState<string>(() => crypto.randomUUID());

  const [withReturn, setWithReturn] = useState(false);
  const [mobility, setMobility] = useState("none");
  const [companions, setCompanions] = useState(0);
  const [doorToDoor, setDoorToDoor] = useState(false);

  const hasNeeds = mobility !== "none" || companions > 0 || doorToDoor;

  function handleSubmit() {
    if (elapsedRef.current) {
      elapsedRef.current.value = String(Date.now() - startRef.current);
    }
  }

  if (state.ok) {
    return <SuccessBanner />;
  }

  return (
    <div className="relative rounded-[24px] border border-brand-border bg-white p-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.03)] md:p-9">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-yellow/20 text-brand-dark">
            <Icon name="accessible" className="text-[20px]" />
          </div>
          <div>
            <h2 className="text-[19px] font-bold tracking-tight text-brand-dark sm:text-[21px]">
              Demande de taxi PMR
            </h2>
            <p className="text-[13px] text-slate-500">
              Remplissez le formulaire — notre équipe confirme votre course
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200/60 bg-emerald-50 px-3.5 py-1.5 text-[12px] font-semibold text-emerald-800 sm:self-center">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span>Prise en charge mutuelle conventionnée</span>
        </div>
      </div>

      {/* Global error */}
      {!state.ok && state.message && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {state.message}
        </div>
      )}

      <form action={formAction} onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        {/* Hidden anti-spam & meta */}
        {/* Honeypot — hidden from real users */}
        <input
          type="text"
          name="hp"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <input type="hidden" name="idempotencyKey" value={idKey} />
        <input type="hidden" name="elapsedMs" defaultValue="0" ref={elapsedRef} />

        {/* ── 1. Passenger ──────────────────────────────────── */}
        <fieldset>
          <legend className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Informations passager
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col">
              <FieldLabel icon="user" iconClass="text-slate-500" label="Prénom" required />
              <input
                className={inputClass}
                type="text"
                name="firstName"
                placeholder="Marie"
                autoComplete="given-name"
                required
              />
              <FieldError errors={state.errors} field="firstName" />
            </div>
            <div className="flex flex-col">
              <FieldLabel icon="user" iconClass="text-slate-500" label="Nom" required />
              <input
                className={inputClass}
                type="text"
                name="lastName"
                placeholder="Dupont"
                autoComplete="family-name"
                required
              />
              <FieldError errors={state.errors} field="lastName" />
            </div>
            <div className="flex flex-col">
              <FieldLabel icon="phone" iconClass="text-slate-500" label="Téléphone" required />
              <input
                className={inputClass}
                type="tel"
                name="phone"
                placeholder="+32 2 315 31 00"
                autoComplete="tel"
                required
              />
              <FieldError errors={state.errors} field="phone" />
            </div>
            <div className="flex flex-col">
              <FieldLabel icon="user" iconClass="text-slate-500" label="E-mail" required />
              <input
                className={inputClass}
                type="email"
                name="email"
                placeholder="marie@exemple.be"
                autoComplete="email"
                required
              />
              <FieldError errors={state.errors} field="email" />
            </div>
          </div>
        </fieldset>

        {/* ── 2. Trip ───────────────────────────────────────── */}
        <fieldset>
          <legend className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Trajet aller
          </legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col lg:col-span-2">
              <FieldLabel icon="origin" iconClass="text-amber-500" label="Adresse de départ" required />
              <input
                className={inputClass}
                type="text"
                name="pickup"
                placeholder="Adresse complète ou établissement…"
                required
              />
              <FieldError errors={state.errors} field="pickup" />
            </div>
            <div className="flex flex-col lg:col-span-2">
              <FieldLabel icon="pin" iconClass="text-brand-accent" label="Destination" required />
              <input
                className={inputClass}
                type="text"
                name="dropoff"
                placeholder="Clinique, domicile, gare…"
                required
              />
              <FieldError errors={state.errors} field="dropoff" />
            </div>
            <div className="flex flex-col">
              <FieldLabel icon="calendar" iconClass="text-slate-500" label="Date" required />
              <input
                className={inputClass}
                type="date"
                name="tripDate"
                required
              />
              <FieldError errors={state.errors} field="tripDate" />
            </div>
            <div className="flex flex-col">
              <FieldLabel icon="clock" iconClass="text-slate-500" label="Heure" required />
              <input
                className={inputClass}
                type="time"
                name="tripTime"
                required
              />
              <FieldError errors={state.errors} field="tripTime" />
            </div>
          </div>
        </fieldset>

        {/* ── 3. Return trip ────────────────────────────────── */}
        <div>
          <label className="flex cursor-pointer select-none items-center gap-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 rounded accent-[#0B0B0F]"
              checked={withReturn}
              onChange={(e) => setWithReturn(e.target.checked)}
            />
            <span className="text-[14px] font-semibold text-brand-dark">
              Ajouter un trajet retour
            </span>
          </label>

          {withReturn && (
            <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4 sm:grid-cols-2">
              <p className="col-span-full text-[12px] text-slate-500">
                Le retour empruntera le trajet inverse (destination → départ).
              </p>
              <div className="flex flex-col">
                <FieldLabel icon="calendar" iconClass="text-slate-500" label="Date retour" required />
                <input
                  className={inputClass}
                  type="date"
                  name="returnDate"
                  required={withReturn}
                />
                <FieldError errors={state.errors} field="returnDate" />
              </div>
              <div className="flex flex-col">
                <FieldLabel icon="clock" iconClass="text-slate-500" label="Heure retour" required />
                <input
                  className={inputClass}
                  type="time"
                  name="returnTime"
                  required={withReturn}
                />
                <FieldError errors={state.errors} field="returnTime" />
              </div>
            </div>
          )}
        </div>

        {/* ── 4. PMR needs ──────────────────────────────────── */}
        <fieldset>
          <legend className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Configuration PMR &amp; besoins spécifiques
          </legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col">
              <FieldLabel icon="accessible" iconClass="text-brand-accent" label="Aide à la mobilité" />
              <select
                className={selectClass}
                name="mobilityAid"
                value={mobility}
                onChange={(e) => setMobility(e.target.value)}
              >
                {MOBILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Options supplémentaires
              </span>
              <label className="flex cursor-pointer select-none items-center gap-3 rounded-xl border border-brand-border bg-brand-surface p-3 transition-colors hover:border-slate-300 hover:bg-slate-50">
                <input
                  type="checkbox"
                  name="staysInWheelchair"
                  className="h-4 w-4 rounded accent-[#0B0B0F]"
                  disabled={mobility === "none"}
                />
                <span className="flex flex-col">
                  <span className="text-[13px] font-semibold text-brand-dark">
                    Reste dans le fauteuil pendant le trajet
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Arrimage homologué 4 points
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer select-none items-center gap-3 rounded-xl border border-brand-border bg-brand-surface p-3 transition-colors hover:border-slate-300 hover:bg-slate-50">
                <input
                  type="checkbox"
                  name="doorToDoor"
                  className="h-4 w-4 rounded accent-[#0B0B0F]"
                  checked={doorToDoor}
                  onChange={(e) => setDoorToDoor(e.target.checked)}
                />
                <span className="flex flex-col">
                  <span className="text-[13px] font-semibold text-brand-dark">
                    Accompagnement porte-à-porte
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Aide active aux étages ou à l&apos;embarquement
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-col">
              <FieldLabel icon="user" iconClass="text-slate-500" label="Accompagnants (hors passager PMR)" />
              <select
                className={selectClass}
                name="companions"
                value={companions}
                onChange={(e) => setCompanions(Number(e.target.value))}
              >
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? "Aucun accompagnant" : `${n} accompagnant${n > 1 ? "s" : ""}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Remarques éventuelles
              </span>
              <textarea
                className="min-h-[96px] w-full resize-none rounded-xl border border-brand-border bg-brand-surface px-3.5 py-3 text-[14px] text-brand-dark transition-all placeholder:text-slate-400 focus:border-brand-dark focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,205,26,0.25)]"
                name="notes"
                placeholder="Type de fauteuil, étage, code d'entrée, instructions particulières…"
                rows={3}
              />
            </div>
          </div>
        </fieldset>

        {/* ── 5. Consents ───────────────────────────────────── */}
        <div className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-brand-surface p-5">
          <label className="flex cursor-pointer select-none items-start gap-3">
            <input
              type="checkbox"
              name="privacyConsent"
              className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#0B0B0F]"
              required
            />
            <span className="text-[13px] text-slate-700">
              J&apos;accepte la{" "}
              <a
                href="/cookie-policy"
                className="font-semibold text-brand-accent underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                politique de confidentialité
              </a>{" "}
              et le traitement de mes données personnelles pour la gestion de ma réservation.{" "}
              <span className="text-red-500">*</span>
            </span>
          </label>
          <FieldError errors={state.errors} field="privacyConsent" />

          {hasNeeds && (
            <label className="flex cursor-pointer select-none items-start gap-3">
              <input
                type="checkbox"
                name="healthConsent"
                className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#0B0B0F]"
                required={hasNeeds}
              />
              <span className="text-[13px] text-slate-700">
                J&apos;autorise la transmission des informations relatives à mes besoins de mobilité
                au chauffeur afin d&apos;assurer un service adapté.{" "}
                <span className="text-red-500">*</span>
              </span>
            </label>
          )}
        </div>

        {/* ── 6. Submit ─────────────────────────────────────── */}
        <div className="flex flex-col items-stretch justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-yellow/20 text-brand-dark">
              <Icon name="shield" className="text-[16px]" />
            </div>
            <div className="text-[12px] text-slate-600">
              <span className="block font-semibold text-brand-dark">
                Tarif identique à un taxi ordinaire
              </span>
              <span>Attestation officielle fournie après chaque course</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-yellow px-8 py-3.5 text-[14px] font-bold text-brand-charcoal shadow-[0_4px_16px_rgba(249,205,26,0.35)] transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-dark hover:shadow-[0_8px_24px_rgba(249,205,26,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <>
                <span>Envoi en cours…</span>
                <Icon name="sync" className="text-[13px] animate-spin" />
              </>
            ) : (
              <>
                <span>Envoyer ma demande</span>
                <Icon name="arrow" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
