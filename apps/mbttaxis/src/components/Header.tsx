"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  callCta,
  navLinks,
  reserveCta,
  serviceLinks,
} from "../../content/nav";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
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
    setServicesOpen(false);
  }, [pathname]);

  const isServicesActive =
    pathname === "/services" || pathname.startsWith("/services/");

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
              if ("children" in link && link.children) {
                return (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => setServicesOpen(true)}
                    onMouseLeave={() => setServicesOpen(false)}
                  >
                    <Link
                      href={link.href}
                      className={`whitespace-nowrap rounded-full px-2.5 py-2 text-sm leading-none transition-colors xl:px-3 ${
                        isServicesActive
                          ? "bg-brand text-white"
                          : "text-body hover:text-brand"
                      }`}
                      aria-expanded={servicesOpen}
                      aria-haspopup="true"
                    >
                      {link.label}
                      <i className="fa fa-angle-down ml-1 text-xs" aria-hidden />
                    </Link>
                    {servicesOpen ? (
                      <div className="absolute left-0 top-full z-50 min-w-[14rem] pt-2">
                        <div className="rounded-2xl border border-border bg-white p-2 shadow-sm">
                          {link.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block rounded-xl px-3 py-2.5 text-sm text-body hover:bg-soft hover:text-brand"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              }

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
            <a
              href={callCta.href}
              className="btn btn-secondary ml-2 whitespace-nowrap shrink-0 !px-4 !py-2 text-sm"
            >
              {callCta.label}
            </a>
            <Link
              href={reserveCta.href}
              className="btn btn-primary whitespace-nowrap shrink-0 !px-4 !py-2 text-sm"
            >
              {reserveCta.label}
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
            className="mt-2 max-h-[80vh] overflow-y-auto rounded-[1.5rem] border border-border bg-white p-4 shadow-sm lg:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navLinks.map((link) => {
                if ("children" in link && link.children) {
                  return (
                    <div key={link.href} className="pt-1">
                      <Link
                        href={link.href}
                        className={`block rounded-full px-4 py-3 font-medium ${
                          isServicesActive ? "bg-brand text-white" : "text-body"
                        }`}
                      >
                        {link.label}
                      </Link>
                      <div className="ml-2 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="rounded-full px-3 py-2 text-sm text-body"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }
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
              <a href={callCta.href} className="btn btn-secondary mt-2 w-full">
                {callCta.labelFull}
              </a>
              <Link href={reserveCta.href} className="btn btn-primary w-full">
                {reserveCta.label}
              </Link>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
