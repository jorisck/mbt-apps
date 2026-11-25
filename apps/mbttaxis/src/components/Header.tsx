"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { contactCta, navLinks } from "../../content/nav";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 120 && y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-opacity duration-300 ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="container-mbt pt-4">
        <div className="flex items-center gap-3 rounded-full border border-border bg-white px-4 py-2 shadow-sm lg:px-6">
          <Link href="/" className="shrink-0" aria-label="MBT Taxis — Accueil">
            <Image
              src="/logo.png"
              alt="MBT Taxis"
              width={100}
              height={60}
              className="h-11 w-auto object-contain"
              priority
            />
          </Link>

          <nav
            className="ml-auto hidden min-w-0 items-center gap-0.5 lg:flex xl:gap-1"
            aria-label="Principal"
          >
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap rounded-full px-2.5 py-2 text-sm leading-none transition-colors xl:px-3 ${
                    active
                      ? "bg-brand text-white"
                      : "text-body hover:text-brand"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href={contactCta.href}
              className="btn btn-primary ml-2 whitespace-nowrap shrink-0"
            >
              {contactCta.label}
            </Link>
          </nav>

          <button
            type="button"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-border text-ink lg:hidden"
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
            className="mt-2 rounded-[1.5rem] border border-border bg-white p-4 shadow-sm lg:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-full px-4 py-3 ${
                      active ? "bg-brand text-white" : "text-body"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link href={contactCta.href} className="btn btn-primary mt-2 w-full">
                {contactCta.label}
              </Link>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
