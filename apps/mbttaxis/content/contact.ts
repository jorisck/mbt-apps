import { site } from "./site";

export const contact = {
  meta: {
    title: "Contacter MBT Taxis à Bruxelles",
    description:
      "Téléphone, e-mail, adresse, horaires et formulaire de contact de MBT Taxis à Bruxelles.",
  },
  hero: {
    eyebrow: "Nous contacter",
    title: "Une question ? Parlons-en simplement.",
    text: "Réservation, accessibilité, devis d’adaptation ou information sur un véhicule : choisissez le canal qui vous convient.",
    primaryCta: "Appeler la centrale",
    primaryHref: site.phoneHref,
    secondaryCta: "Envoyer un e-mail",
    secondaryHref: `mailto:${site.email}`,
  },
  details: {
    title: "Coordonnées",
    address: site.address.full,
    phone: site.phone,
    phoneHref: site.phoneHref,
    email: site.email,
    mapCta: "Afficher l’adresse sur la carte",
    mapHref:
      "https://www.google.com/maps/search/?api=1&query=Rue+des+B%C3%A9guines+160+1080+Molenbeek-Saint-Jean",
  },
  hours: {
    title: "Horaires",
    value: "Du lundi au vendredi\nDe 8h à 17h",
    valueLines: ["Du lundi au vendredi", "De 8h à 17h"],
  },
  form: {
    title: "Formulaire de contact",
    intro:
      "Expliquez-nous votre demande. Notre équipe vous répondra dans les meilleurs délais pendant les heures d’ouverture.",
    submit: "Envoyer mon message",
    successTitle: "Votre message a bien été envoyé.",
    successText: "Nous vous répondrons dans les meilleurs délais.",
    subjects: [
      "Réservation de taxi",
      "Transport PMR ou VSL",
      "Adaptation d’un véhicule",
      "Location ou vente",
      "Handycab",
      "Autre question",
    ],
  },
} as const;
