"use client";

import { useActionState } from "react";
import { contact } from "../../../content/contact";
import { submitContact, type FormState } from "../../app/actions/forms";

const initial: FormState = { ok: false };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-border bg-soft p-8 text-center">
        <h3 className="text-brand">{contact.form.successTitle}</h3>
        <p className="mt-2 text-body">{contact.form.successText}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <div className="form-field">
        <label htmlFor="name">Nom et prénom *</label>
        <input id="name" name="name" required />
        {state.errors?.name?.[0] ? (
          <p className="form-error">{state.errors.name[0]}</p>
        ) : null}
      </div>
      <div className="form-field">
        <label htmlFor="phone">Numéro de téléphone</label>
        <input id="phone" name="phone" type="tel" />
      </div>
      <div className="form-field">
        <label htmlFor="email">Adresse e-mail *</label>
        <input id="email" name="email" type="email" required />
        {state.errors?.email?.[0] ? <p className="form-error">{state.errors.email[0]}</p> : null}
      </div>
      <div className="form-field">
        <label htmlFor="subject">Objet de la demande *</label>
        <select id="subject" name="subject" required defaultValue="">
          <option value="" disabled>
            Choisir un objet
          </option>
          {contact.form.subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        {state.errors?.subject?.[0] ? (
          <p className="form-error">{state.errors.subject[0]}</p>
        ) : null}
      </div>
      <div className="form-field">
        <label htmlFor="message">Message *</label>
        <textarea id="message" name="message" required />
        {state.errors?.message?.[0] ? (
          <p className="form-error">{state.errors.message[0]}</p>
        ) : null}
      </div>
      <div className="form-field">
        <label className="flex items-start gap-3 !normal-case">
          <input type="checkbox" name="consent" value="on" required className="mt-1" />
          <span>
            J’accepte que MBT utilise ces informations pour traiter ma demande.
          </span>
        </label>
        {state.errors?.consent?.[0] ? (
          <p className="form-error">{state.errors.consent[0]}</p>
        ) : null}
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Envoi…" : contact.form.submit}
      </button>
    </form>
  );
}
