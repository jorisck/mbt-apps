"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { site } from "../../content/site";
import { Icon } from "./Icon";

const nav = [
  { href: "#flotte", label: "Véhicules" },
  { href: "#chauffeurs", label: "Chauffeurs" },
  { href: "#application", label: "Application" },
  { href: "#tarifs", label: "Tarifs & agréments" },
  { href: "#contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-border bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-6">
        <Link
          href="/"
          className="group shrink-0"
          aria-label="HandyCab — Accueil"
        >
          <Image
            src="/logo.png"
            alt="HandyCab"
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl object-contain shadow-[0_2px_8px_rgba(249,205,26,0.25)]"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-[14px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand-dark"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={site.phoneHref}
            className="hidden flex-col pr-1 text-right leading-none xl:flex"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Dispatch 24/7 PMR
            </span>
            <span className="text-[14px] font-semibold text-brand-dark transition-colors hover:text-brand-accent">
              {site.phone}
            </span>
          </a>
          <a
            href="#calculateur"
            className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-5 py-2.5 text-[13px] font-bold text-brand-charcoal shadow-[0_4px_14px_rgba(249,205,26,0.3)] transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-dark hover:shadow-[0_6px_20px_rgba(249,205,26,0.4)]"
          >
            <span>Réserver</span>
            <Icon name="arrow" />
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-border text-brand-dark lg:hidden"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <i className={`fa ${open ? "fa-times" : "fa-bars"}`} aria-hidden />
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-brand-border bg-white px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-2.5 text-[15px] font-medium text-slate-700 hover:bg-brand-surface"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
