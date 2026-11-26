"use client";

import { useSearchParams } from "next/navigation";
import { useActionState, useMemo, useState } from "react";
import {
  reservation,
  reservationServices,
  transportServices,
  type ReservationServiceValue,
} from "../../../content/reservation";
import { submitReservation, type FormState } from "../../app/actions/forms";

const initial: FormState = { ok: false };

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
  const [state, action, pending] = useActionState(submitReservation, initial);

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

  return (
    <form action={action} className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
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

      <Field name="name" label="Nom et prénom" error={state.errors?.name} required />
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
          <Field
            name="tripDate"
            label="Date du trajet"
            type="date"
            error={state.errors?.tripDate}
            required
          />
          <Field
            name="tripTime"
            label="Heure souhaitée"
            type="time"
            error={state.errors?.tripTime}
            required
          />
          <Field
            name="pickup"
            label="Adresse de départ"
            as="textarea"
            error={state.errors?.pickup}
            required
          />
          <Field
            name="dropoff"
            label="Adresse d'arrivée"
            as="textarea"
            error={state.errors?.dropoff}
            required
          />
          <Field name="passengers" label="Nombre de passagers" type="number" />
          <div className="form-field">
            <label htmlFor="tripType">Type de trajet</label>
            <select id="tripType" name="tripType" defaultValue="aller">
              <option value="aller">Aller simple</option>
              <option value="aller-retour">Aller-retour</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="wheelchair">Fauteuil roulant</label>
            <select id="wheelchair" name="wheelchair" defaultValue="non">
              <option value="non">Non</option>
              <option value="manuel">Manuel</option>
              <option value="electrique">Électrique</option>
              <option value="preciser">À préciser</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="companion">Présence d’un accompagnant</label>
            <select id="companion" name="companion" defaultValue="non">
              <option value="non">Non</option>
              <option value="oui">Oui</option>
            </select>
          </div>
        </>
      ) : null}

      {isAdaptation ? (
        <>
          <Field
            name="vehicleBrand"
            label="Marque du véhicule"
            error={state.errors?.vehicleBrand}
            required
          />
          <Field
            name="vehicleModel"
            label="Modèle"
            error={state.errors?.vehicleModel}
            required
          />
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
            {state.errors?.searchType?.[0] ? (
              <p className="form-error">{state.errors.searchType[0]}</p>
            ) : null}
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
        label={
          isAdaptation
            ? "Description du besoin"
            : "Informations supplémentaires"
        }
        as="textarea"
      />

      <div className="form-field form-field--consent">
        <label className="flex items-start gap-3 !normal-case">
          <input
            type="checkbox"
            name="consent"
            value="on"
            required
            className="mt-1"
          />
          <span>{reservation.form.consent}</span>
        </label>
        {state.errors?.consent?.[0] ? (
          <p className="form-error">{state.errors.consent[0]}</p>
        ) : null}
      </div>

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
