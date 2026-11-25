import { site } from "./site";

export const serviceLinks = [
  { href: "/services/entreprises", label: "Taxi pour entreprises" },
  { href: "/services/quotidien", label: "Taxi au quotidien" },
  { href: "/services/vsl", label: "Transport VSL" },
  { href: "/services/pmr", label: "Taxi PMR" },
  { href: "/services/adaptation", label: "Adaptation PMR" },
  { href: "/services/location-vente", label: "Location & vente" },
] as const;

export const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/services", label: "Services", children: serviceLinks },
  { href: "/handycab", label: "Handycab" },
  { href: "/centrale", label: "Centrale téléphonique" },
  { href: "/about-us", label: "À propos" },
  { href: "/contactus", label: "Contact" },
] as const;

export const callCta = {
  href: site.phoneHref,
  label: "Appeler",
  labelFull: `Appeler le ${site.phoneShort}`,
} as const;

export const reserveCta = {
  href: "/reservation",
  label: "Réserver",
} as const;

/** Conservé pour compatibilité — le CTA principal est désormais Réserver */
export const contactCta = {
  href: "/contactus",
  label: "Contact",
} as const;
