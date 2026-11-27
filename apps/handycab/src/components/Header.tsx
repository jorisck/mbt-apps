"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "../../content/site";
import { Icon } from "./Icon";

interface HeaderProps {
  /** Prénom du passager connecté, ou undefined si non connecté. */
  firstName?: string;
}

export function Header({ firstName }: HeaderProps = {}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="bg-brand-dark text-white">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-4 px-6 text-[11px] sm:text-[12px]">
          <p className="truncate text-slate-300">
            Besoin d’aide pour réserver ? Appelez le{" "}
            <a
              href={site.phoneHref}
              className="font-semibold text-brand-yellow hover:underline"
            >
              {site.phoneDisplay}
            </a>
            .
          </p>
          <a
            href={site.phoneHref}
            className="hidden shrink-0 items-center gap-1.5 font-semibold text-white transition-colors hover:text-brand-yellow sm:inline-flex"
          >
            <Icon name="phone" className="text-[11px] text-brand-yellow" />
            Appeler
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6">
        <div className="flex items-center gap-3 rounded-full border border-brand-border bg-white px-3 py-2 shadow-sm sm:px-4 lg:px-6">
          <Link
            href="/"
            className="shrink-0"
            aria-label="Handycab — Accueil"
          >
            <Image
              src="/logo.png"
              alt="Handycab"
              width={44}
              height={44}
              className="h-10 w-10 object-contain sm:h-11 sm:w-11"
              priority
            />
          </Link>

          <nav
            className="ml-auto hidden min-w-0 items-center gap-0.5 xl:flex xl:gap-1"
            aria-label="Principal"
          >
            {nav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-medium leading-none transition-colors xl:px-3 ${
                    active
                      ? "bg-brand-dark text-white"
                      : "text-slate-600 hover:text-brand-dark"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <a
              href={site.phoneHref}
              className="ml-2 inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-brand-dark px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-black"
            >
              <Icon name="phone" className="text-brand-yellow" />
              Appeler
            </a>
            <a
              href="/compte"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-yellow px-4 py-2 text-[13px] font-bold text-brand-charcoal transition-colors hover:bg-brand-yellow-dark"
              title={firstName ? `Mon compte — ${firstName}` : "Mon compte"}
            >
              <i className="fa fa-user-circle-o" aria-hidden />
              {firstName ?? "Connexion"}
            </a>
          </nav>

          <button
            type="button"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-brand-border text-brand-dark xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <i className={`fa ${open ? "fa-times" : "fa-bars"}`} aria-hidden />
          </button>
        </div>

        {open ? (
          <div
            id="mobile-menu"
            className="mt-2 max-h-[80vh] overflow-y-auto rounded-[1.5rem] border border-brand-border bg-white p-4 shadow-sm xl:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {nav.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-4 py-3 text-[15px] font-medium transition-colors ${
                      active
                        ? "bg-brand-dark text-white"
                        : "text-slate-700 hover:bg-brand-surface"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <a
                href={site.phoneHref}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand-dark px-4 py-3 text-[14px] font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                <Icon name="phone" className="text-brand-yellow" />
                Appeler {site.phone}
              </a>
              <a
                href="/compte"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-yellow px-4 py-3 text-[14px] font-bold text-brand-charcoal"
                onClick={() => setOpen(false)}
              >
                <i className="fa fa-user-circle-o" aria-hidden />
                {firstName ? `Mon compte — ${firstName}` : "Mon compte / Connexion"}
              </a>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
