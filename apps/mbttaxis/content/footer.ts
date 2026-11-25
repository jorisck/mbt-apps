import { site } from "./site";

export const footer = {
  brand: {
    title: "MBT Taxis",
    tagline: "La mobilité pour tous depuis 1991.",
    agreement:
      "Entreprise agréée en tant que service de transport médico-sanitaire sur le territoire de la Région bilingue de Bruxelles-Capitale — agrément n° 30.01.16.",
  },
  services: {
    title: "Services",
    links: [
      { href: "/services/entreprises", label: "Taxi pour entreprises" },
      { href: "/services/quotidien", label: "Taxi au quotidien" },
      { href: "/services/vsl", label: "Transport VSL" },
      { href: "/services/pmr", label: "Taxi PMR" },
      { href: "/services/adaptation", label: "Adaptation PMR" },
      { href: "/services/location-vente", label: "Location & vente" },
    ],
  },
  discover: {
    title: "Découvrir",
    links: [
      { href: "/handycab", label: "Handycab" },
      { href: "/centrale", label: "Centrale téléphonique" },
      { href: "/about-us", label: "À propos" },
      { href: "/reservation", label: "Réserver" },
      { href: "/contactus", label: "Contact" },
    ],
  },
  contact: {
    title: "Coordonnées",
    phone: site.phone,
    phoneHref: site.phoneHref,
    email: site.email,
    address: site.address.full,
    hours: site.hours,
  },
  legal: {
    cookies: { href: "/cookie-policy", label: "Cookies et confidentialité" },
  },
  social: {
    title: "Suivez-nous",
    facebook: "https://www.facebook.com/",
    linkedin: "https://www.linkedin.com/",
  },
  copyright: "Copyright © MBT Taxis",
} as const;
