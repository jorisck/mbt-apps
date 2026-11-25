export const site = {
  name: "Handycab",
  tagline: "Le taxi adapté, simplement.",
  url: "https://www.handycab.be",
  locale: "fr-BE",
  email: "info@handycab.be",
  phone: "02 315 31 00",
  phoneDisplay: "+32 (0)2 315 31 00",
  phoneHref: "tel:+3223153100",
  bookingUrl: "https://booking.handycab.be/",
  conditionsUrl:
    "https://booking.handycab.be/uploads/Handycab_Conditions_generales.pdf",
  playStoreUrl: "https://play.google.com/store/apps/details?id=be.handycab.android",
  appStoreUrl: "https://apps.apple.com/be/app/handycab/id1495297360",
  parent: {
    name: "MBT Taxis",
    shortName: "MBT",
    url:
      process.env.NEXT_PUBLIC_MBTTAXIS_URL ?? "https://www.mbttaxis.be",
    label: "Un service proposé par",
  },
  address: {
    street: "Rue des Béguines 160",
    city: "Bruxelles",
    postalCode: "1080",
    country: "BE",
  },
} as const;

export const nav = [
  { href: "/", label: "Accueil" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/le-service", label: "Le service" },
  { href: "/application", label: "L’application" },
  { href: "/organisations", label: "Organisations" },
  { href: "/a-propos", label: "À propos" },
  { href: "/aide", label: "Aide" },
] as const;

export const footer = {
  brand: {
    title: "Handycab",
    body: "Plateforme de réservation de taxis PMR à Bruxelles, accessible depuis le web, l’application mobile ou par téléphone. Un service proposé par MBT Taxis.",
  },
  columns: [
    {
      title: "Réserver",
      links: [
        { href: site.bookingUrl, label: "Réserver sur le web", external: true },
        { href: "/application", label: "Télécharger l’application" },
        { href: site.phoneHref, label: "Appeler le service" },
        { href: "/comment-ca-marche", label: "Comment ça marche" },
      ],
    },
    {
      title: "Le service",
      links: [
        { href: "/le-service#vehicules", label: "Les taxis adaptés" },
        { href: "/le-service#chauffeurs", label: "Les chauffeurs" },
        { href: "/le-service#tarifs", label: "Paiement et tarifs" },
        { href: "/organisations", label: "Organisations" },
        { href: "/a-propos", label: "À propos" },
      ],
    },
    {
      title: "Aide",
      links: [
        { href: "/aide#faq", label: "Questions fréquentes" },
        { href: "/aide#contact", label: "Contact" },
        { href: "/aide#application", label: "Assistance application" },
        { href: site.conditionsUrl, label: "Conditions générales", external: true },
        { href: "/cookie-policy", label: "Cookies et confidentialité" },
      ],
    },
  ],
} as const;
