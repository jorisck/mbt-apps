"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cookies } from "../../content/cookies";
import { COOKIE_KEY, type CookieConsent } from "../lib/cookies";

export function CookieBanner() {
  const [consent, setConsent] = useState<CookieConsent | "unknown">("unknown");

  useEffect(() => {
    const raw = window.localStorage.getItem(COOKIE_KEY);
    if (raw === "all" || raw === "essential") setConsent(raw);
    else setConsent(null);
  }, []);

  if (consent === "unknown" || consent !== null) return null;

  const save = (value: Exclude<CookieConsent, null>) => {
    window.localStorage.setItem(COOKIE_KEY, value);
    setConsent(value);
    window.dispatchEvent(new Event("mbt-cookie-change"));
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-4">
      <div className="container-mbt rounded-3xl border border-brand bg-white p-5 shadow-sm">
        <p className="mb-4 text-body">
          {cookies.banner.text}{" "}
          <Link href="/cookie-policy" className="text-brand underline">
            En savoir plus
          </Link>
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn btn-primary" onClick={() => save("all")}>
            {cookies.banner.acceptAll}
          </button>
          <button
            type="button"
            className="btn border border-brand text-brand"
            onClick={() => save("essential")}
          >
            {cookies.banner.essentialOnly}
          </button>
        </div>
      </div>
    </div>
  );
}
