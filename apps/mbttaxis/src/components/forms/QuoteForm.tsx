"use client";

import { useActionState } from "react";
import { adaptation } from "../../../content/adaptation";
import { submitQuote, type FormState } from "../../app/actions/forms";

const initial: FormState = { ok: false };

export function QuoteForm() {
  const [state, action, pending] = useActionState(submitQuote, initial);

  if (state.ok) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <h3 className="text-brand">{adaptation.form.successTitle}</h3>
        <p className="mt-2 text-body">{adaptation.form.successText}</p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
      <div className="form-field">
        <label htmlFor="name">Votre nom *</label>
        <input id="name" name="name" required />
        {state.errors?.name?.[0] ? <p className="form-error">{state.errors.name[0]}</p> : null}
      </div>
      <div className="form-field">
        <label htmlFor="phone">Numéro de téléphone</label>
        <input id="phone" name="phone" type="tel" />
      </div>
      <div className="form-field">
        <label htmlFor="email">Votre e-mail *</label>
        <input id="email" name="email" type="email" required />
        {state.errors?.email?.[0] ? <p className="form-error">{state.errors.email[0]}</p> : null}
      </div>
      <div className="form-field">
        <label htmlFor="vehicle">Marque & modèle du véhicule *</label>
        <input id="vehicle" name="vehicle" required />
        {state.errors?.vehicle?.[0] ? <p className="form-error">{state.errors.vehicle[0]}</p> : null}
      </div>
      <fieldset className="mb-4">
        <legend className="mb-2">Adaptation souhaitée *</legend>
        <label className="mr-4 inline-flex items-center gap-2">
          <input type="checkbox" name="floor" /> Plancher abaissé
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="ramp" /> Rampe
        </label>
      </fieldset>
      <div className="form-field">
        <label htmlFor="details">Détails du projet</label>
        <textarea id="details" name="details" />
      </div>
      <div className="form-field">
        <label htmlFor="desiredDate">Date souhaitée</label>
        <input id="desiredDate" name="desiredDate" type="date" />
      </div>
      <button type="submit" className="btn btn-primary mt-2" disabled={pending}>
        {pending ? "Envoi…" : adaptation.form.submit}
      </button>
    </form>
  );
}
