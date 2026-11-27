"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  reservation,
  reservationServices,
  transportServices,
  type ReservationServiceValue,
} from "../../../content/reservation";
import { submitReservation, type FormState } from "../../app/actions/forms";

const initial: FormState = { ok: false };

/** Palette Handycab (alignée sur HandycabCard) */
const HC = {
  yellow: "#f9cd1a",
  yellowSoft: "#fff8d6",
  yellowMid: "#f5e08a",
  ink: "#010102",
  body: "#495057",
  border: "#e8e4d0",
  surface: "#fbfaf5",
} as const;

const validServices = new Set(
  reservationServices.map((s) => s.value),
);

function resolveService(preset?: string | null): ReservationServiceValue {
  if (preset && validServices.has(preset as ReservationServiceValue)) {
    return preset as ReservationServiceValue;
  }
  return "pmr";
}

export function ReservationForm({
  defaultService,
}: {
  defaultService?: string;
}) {
  const searchParams = useSearchParams();
  const [service, setService] = useState<ReservationServiceValue>(() =>
    resolveService(defaultService ?? searchParams.get("service")),
  );
  const [tripType, setTripType] = useState("aller");
  const [wheelchair, setWheelchair] = useState("non");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [startedAt] = useState(() => Date.now());
  const [state, action, pending] = useActionState(submitReservation, initial);

  useEffect(() => {
    // no-op: keeps startedAt stable for elapsed_ms
  }, []);

  const submitLabel = useMemo(() => {
    if (service === "adaptation") return reservation.form.submitAdaptation;
    if (service === "location-vente") return reservation.form.submitLocation;
    return reservation.form.submitTransport;
  }, [service]);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-border bg-soft p-8 text-center">
        <h3 className="text-brand">{reservation.form.successTitle}</h3>
        <p className="mt-2 text-body">{reservation.form.successText}</p>
      </div>
    );
  }

  const isTransport = transportServices.includes(service);
  const isAdaptation = service === "adaptation";
  const isLocation = service === "location-vente";
  const needsHealth = isTransport && wheelchair !== "non";

  return (
    <form action={action} className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="elapsedMs" value={Math.max(0, Date.now() - startedAt)} />
      <input type="text" name="hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="form-field">
        <label htmlFor="service">Service demandé *</label>
        <select
          id="service"
          name="service"
          value={service}
          onChange={(e) => setService(e.target.value as ReservationServiceValue)}
          required
        >
          {reservationServices.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {state.errors?.service?.[0] ? (
          <p className="form-error">{state.errors.service[0]}</p>
        ) : null}
      </div>

      {service === "pmr" ? <PmrHandycabBanner /> : null}

      <div className="form-fields-pair grid gap-4 md:grid-cols-2">
        <Field name="firstName" label="Prénom" error={state.errors?.firstName} required />
        <Field name="lastName" label="Nom" error={state.errors?.lastName} required />
      </div>
      <Field
        name="phone"
        label="Numéro de téléphone"
        type="tel"
        defaultValue="+32"
        error={state.errors?.phone}
        required
      />
      <Field name="email" label="Adresse e-mail" type="email" error={state.errors?.email} required />

      {isTransport ? (
        <>
          <Field name="tripDate" label="Date du trajet" type="date" error={state.errors?.tripDate} required />
          <Field name="tripTime" label="Heure souhaitée" type="time" error={state.errors?.tripTime} required />
          <Field name="pickup" label="Adresse de départ" as="textarea" error={state.errors?.pickup} required />
          <Field name="dropoff" label="Adresse d'arrivée" as="textarea" error={state.errors?.dropoff} required />
          <Field name="passengerCount" label="Nombre de passagers" type="number" defaultValue="1" />
          <div className="form-field">
            <label htmlFor="tripType">Type de trajet</label>
            <select
              id="tripType"
              name="tripType"
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
            >
              <option value="aller">Aller simple</option>
              <option value="aller-retour">Aller-retour</option>
            </select>
          </div>
          {tripType === "aller-retour" ? (
            <>
              <Field name="returnDate" label="Date de retour" type="date" error={state.errors?.returnDate} required />
              <Field name="returnTime" label="Heure de retour" type="time" error={state.errors?.returnTime} required />
            </>
          ) : null}
          <div className="form-field">
            <label htmlFor="wheelchair">Aide à la mobilité</label>
            <select
              id="wheelchair"
              name="wheelchair"
              value={wheelchair}
              onChange={(e) => setWheelchair(e.target.value)}
            >
              <option value="non">Aucune</option>
              <option value="manuel">Fauteuil manuel</option>
              <option value="electrique">Fauteuil électrique</option>
              <option value="preciser">Autre (à préciser)</option>
            </select>
          </div>
          {wheelchair === "preciser" ? (
            <Field name="wheelchairNotes" label="Précisez l'aide" error={state.errors?.wheelchairNotes} required />
          ) : null}
          <Field name="companions" label="Nombre d'accompagnants" type="number" defaultValue="0" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="doorToDoor" value="on" /> Aide porte à porte
          </label>
          {(wheelchair === "manuel" || wheelchair === "electrique") ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="staysInWheelchair" value="on" /> Reste dans son fauteuil
            </label>
          ) : null}
        </>
      ) : null}

      {isAdaptation ? (
        <>
          <Field name="vehicleBrand" label="Marque du véhicule" error={state.errors?.vehicleBrand} required />
          <Field name="vehicleModel" label="Modèle" error={state.errors?.vehicleModel} required />
          <Field name="vehicleYear" label="Année du véhicule" />
          <Field name="adaptationType" label="Type d’adaptation souhaitée" />
          <Field name="wheelchairType" label="Type de fauteuil utilisé" />
          <Field name="desiredDate" label="Date souhaitée" type="date" />
        </>
      ) : null}

      {isLocation ? (
        <>
          <div className="form-field">
            <label htmlFor="searchType">Recherche *</label>
            <select id="searchType" name="searchType" defaultValue="location" required>
              <option value="location">Location</option>
              <option value="achat">Achat</option>
            </select>
          </div>
          <Field name="vehicleWish" label="Type de véhicule souhaité" />
          <div className="form-field">
            <label htmlFor="pmrVehicle">Véhicule PMR</label>
            <select id="pmrVehicle" name="pmrVehicle" defaultValue="non">
              <option value="non">Non</option>
              <option value="oui">Oui</option>
            </select>
          </div>
          <Field name="budget" label="Budget indicatif" />
          <Field name="delay" label="Date ou délai souhaité" />
        </>
      ) : null}

      <Field
        name="notes"
        label={isAdaptation ? "Description du besoin" : "Informations supplémentaires"}
        as="textarea"
      />

      <div className="form-field form-field--consent">
        <label className="flex items-start gap-3 !normal-case">
          <input type="checkbox" name="consent" value="on" required className="mt-1" />
          <span>{reservation.form.consent}</span>
        </label>
        {state.errors?.consent?.[0] ? <p className="form-error">{state.errors.consent[0]}</p> : null}
      </div>

      {needsHealth ? (
        <div className="form-field form-field--consent">
          <label className="flex items-start gap-3 !normal-case">
            <input type="checkbox" name="healthConsent" value="on" required className="mt-1" />
            <span>
              J’autorise le traitement de données de santé (besoins de mobilité) pour organiser
              cette course.
            </span>
          </label>
          {state.errors?.healthConsent?.[0] ? (
            <p className="form-error">{state.errors.healthConsent[0]}</p>
          ) : null}
        </div>
      ) : null}

      {state.message ? <p className="form-error mt-2">{state.message}</p> : null}

      {isTransport ? (
        <p className="mt-2 text-sm text-body">{reservation.form.note}</p>
      ) : null}

      <div className="mt-4 flex justify-end">
        <button type="submit" className="btn btn-secondary" disabled={pending}>
          {pending ? "Envoi…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function PmrHandycabBanner() {
  const { pmrHandycab } = reservation;

  return (
    <aside
      className="relative mb-6 overflow-hidden rounded-2xl border px-5 py-5 sm:px-6"
      style={{
        backgroundColor: HC.surface,
        borderColor: HC.border,
      }}
      aria-label="Handycab"
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/3 opacity-70"
        style={{
          background: `linear-gradient(135deg, transparent 0%, ${HC.yellowSoft} 55%, ${HC.yellowMid} 100%)`,
        }}
        aria-hidden
      />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <Image
              src="/images/logos/logo-handycab.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-contain shadow-sm"
            />
            <p
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase"
              style={{
                backgroundColor: HC.yellowSoft,
                borderColor: HC.border,
                color: HC.ink,
              }}
            >
              {pmrHandycab.eyebrow}
            </p>
          </div>
          <p
            className="font-[family-name:var(--font-poppins)] text-lg font-bold tracking-tight sm:text-xl"
            style={{ color: HC.ink }}
          >
            {pmrHandycab.title}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: HC.body }}>
            {pmrHandycab.text}
          </p>
        </div>
        <a
          href={pmrHandycab.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: HC.yellow, color: HC.ink }}
        >
          {pmrHandycab.cta}
          <i className="fa fa-external-link ml-2 text-xs" aria-hidden />
        </a>
      </div>
    </aside>
  );
}

function Field({
  name,
  label,
  type = "text",
  as,
  error,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  as?: "textarea";
  error?: string[];
  required?: boolean;
  defaultValue?: string;
}) {
  const id = name;
  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>
      {as === "textarea" ? (
        <textarea id={id} name={name} required={required} />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
        />
      )}
      {error?.[0] ? <p className="form-error">{error[0]}</p> : null}
    </div>
  );
}
