"use client";

import { useEffect, useState } from "react";
import { reservation } from "../../content/reservation";
import { COOKIE_KEY } from "../lib/cookies";
import { site } from "../../content/site";

export function MapConsent() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () => {
      setAllowed(window.localStorage.getItem(COOKIE_KEY) === "all");
    };
    check();
    window.addEventListener("mbt-cookie-change", check);
    return () => window.removeEventListener("mbt-cookie-change", check);
  }, []);

  if (!allowed) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-2xl bg-[#d6e6f7] p-6 text-center text-brand">
        {reservation.pmrPage.zones.mapBlocked}
      </div>
    );
  }

  const q = encodeURIComponent(
    `${site.address.street}, ${site.address.postalCode} ${site.address.city}`,
  );

  return (
    <iframe
      title="Carte — MBT Taxis"
      className="min-h-[280px] w-full rounded-2xl border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://maps.google.com/maps?q=${q}&z=15&output=embed`}
    />
  );
}
