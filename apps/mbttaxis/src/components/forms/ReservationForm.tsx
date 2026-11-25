"use client";

import { useActionState } from "react";
import { reservation } from "../../../content/reservation";
import { submitReservation, type FormState } from "../../app/actions/forms";

const initial: FormState = { ok: false };

export function ReservationForm() {
  const [state, action, pending] = useActionState(submitReservation, initial);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-border bg-soft p-8 text-center">
        <h3 className="text-brand">{reservation.form.successTitle}</h3>
        <p className="mt-2 text-body">{reservation.form.successText}</p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
      <Field name="name" label="Votre nom et prénom" error={state.errors?.name} required />
      <Field
        name="phone"
        label="Numéro de téléphone"
        type="tel"
        defaultValue="+32"
        error={state.errors?.phone}
        required
      />
      <Field name="email" label="Votre e-mail" type="email" error={state.errors?.email} required />
      <Field
        name="tripAt"
        label="Date & heure du trajet"
        type="datetime-local"
        error={state.errors?.tripAt}
        required
      />
      <Field name="bookingTime" label="Heure de réservation" type="time" />
      <Field name="pickup" label="Adresse de départ" as="textarea" error={state.errors?.pickup} required />
      <Field name="dropoff" label="Adresse d'arrivée" as="textarea" error={state.errors?.dropoff} required />
      <div className="form-field">
        <label htmlFor="wheelchair">Fauteuil roulant</label>
        <select id="wheelchair" name="wheelchair" defaultValue="non" required>
          <option value="oui">Oui</option>
          <option value="non">Non</option>
        </select>
      </div>
      <Field name="notes" label="Information supplémentaire" as="textarea" />
      <div className="mt-4 flex justify-end">
        <button type="submit" className="btn btn-secondary" disabled={pending}>
          {pending ? "Envoi…" : reservation.form.submit}
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
        <input id={id} name={name} type={type} required={required} defaultValue={defaultValue} />
      )}
      {error?.[0] ? <p className="form-error">{error[0]}</p> : null}
    </div>
  );
}
