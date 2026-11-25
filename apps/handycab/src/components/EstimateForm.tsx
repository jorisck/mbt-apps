"use client";

import { useState } from "react";
import { Icon } from "./Icon";

const options = [
  {
    id: "manual",
    title: "Fauteuil roulant manuel",
    hint: "Arrimage 4 points inclus",
    defaultChecked: true,
  },
  {
    id: "electric",
    title: "Fauteuil électrique lourd",
    hint: "Rampe 400 kg & treuil",
    defaultChecked: false,
  },
  {
    id: "ramp",
    title: "Rampe douce assistée",
    hint: "Angle minimal < 11°",
    defaultChecked: true,
  },
  {
    id: "door",
    title: "Accompagnement porte-à-porte",
    hint: "Aide active aux étages",
    defaultChecked: false,
  },
] as const;

function formatPrice(value: number) {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

export function EstimateForm() {
  const [price, setPrice] = useState(32.5);
  const [fading, setFading] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(options.map((o) => [o.id, o.defaultChecked])),
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFading(true);
    window.setTimeout(() => {
      const extras = Object.values(selected).filter(Boolean).length;
      const next = 29.5 + extras * 1.25 + Math.random() * 4;
      setPrice(next);
      setFading(false);
    }, 250);
  }

  return (
    <div className="relative rounded-[24px] border border-brand-border bg-white p-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.03)] md:p-9">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-yellow/20 text-brand-dark">
            <Icon name="calc" className="text-[20px]" />
          </div>
          <div>
            <h2 className="text-[19px] font-bold tracking-tight text-brand-dark sm:text-[21px]">
              Estimation & réservation immédiate
            </h2>
            <p className="text-[13px] text-slate-500">
              Tarifs conventionnés et certifiés Région Bruxelles-Capitale
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200/60 bg-emerald-50 px-3.5 py-1.5 text-[12px] font-semibold text-emerald-800 sm:self-center">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span>Prise en charge mutuelle conventionnée</span>
        </div>
      </div>

      <form className="mt-6 flex flex-col gap-6" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field
            icon="origin"
            iconClass="text-amber-500"
            label="Adresse de départ"
          >
            <input
              className={inputClass}
              placeholder="Adresse ou établissement…"
              defaultValue="Hôpital Erasme, Route de Lennik 808"
              type="text"
              name="from"
            />
          </Field>
          <Field icon="pin" iconClass="text-brand-accent" label="Destination">
            <input
              className={inputClass}
              placeholder="Clinique, domicile, gare…"
              defaultValue="Avenue Louise 240, 1050 Bruxelles"
              type="text"
              name="to"
            />
          </Field>
          <Field icon="calendar" iconClass="text-slate-500" label="Date">
            <input
              className={inputClass}
              type="date"
              name="date"
              defaultValue="2026-05-15"
            />
          </Field>
          <Field icon="clock" iconClass="text-slate-500" label="Heure">
            <input
              className={inputClass}
              type="time"
              name="time"
              defaultValue="09:30"
            />
          </Field>
        </div>

        <div className="pt-2">
          <span className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Configuration PMR & spécificités du passager
          </span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {options.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer select-none items-center gap-3 rounded-xl border border-brand-border bg-brand-surface p-3 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-[#0B0B0F]"
                  checked={selected[opt.id]}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, [opt.id]: e.target.checked }))
                  }
                />
                <span className="flex flex-col">
                  <span className="text-[13px] font-semibold text-brand-dark">
                    {opt.title}
                  </span>
                  <span className="text-[11px] text-slate-500">{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-stretch justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Tarif estimé réglementé
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-[28px] font-extrabold tracking-tight text-brand-dark transition-opacity duration-200"
                  style={{ opacity: fading ? 0.3 : 1 }}
                >
                  {formatPrice(price)}
                </span>
                <span className="text-[12px] font-medium text-slate-500">
                  TTC
                </span>
              </div>
            </div>
            <div className="hidden h-8 w-px bg-slate-200 sm:block" />
            <div className="hidden text-[12px] text-slate-600 sm:block">
              <span className="block font-semibold text-brand-accent">
                Éligible mutuelle & tiers-payant
              </span>
              <span>Attestation officielle fournie après chaque course</span>
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-yellow px-8 py-3.5 text-[14px] font-bold text-brand-charcoal shadow-[0_4px_16px_rgba(249,205,26,0.35)] transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-dark hover:shadow-[0_8px_24px_rgba(249,205,26,0.45)]"
          >
            <span>Estimer le tarif conventionné</span>
            <Icon name="arrow" />
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 text-[14px] text-brand-dark transition-all placeholder:text-slate-400 focus:border-brand-dark focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,205,26,0.25)]";

function Field({
  icon,
  iconClass,
  label,
  children,
}: {
  icon: "origin" | "pin" | "calendar" | "clock";
  iconClass: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
        <Icon name={icon} className={`text-[13px] ${iconClass}`} />
        <span>{label}</span>
      </label>
      {children}
    </div>
  );
}
