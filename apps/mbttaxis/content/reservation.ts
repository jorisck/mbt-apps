import { site } from "./site";

export const reservationServices = [
  { value: "business", label: "Taxi pour entreprises" },
  { value: "quotidien", label: "Taxi au quotidien" },
  { value: "vsl", label: "Transport VSL" },
  { value: "pmr", label: "Taxi PMR" },
  { value: "adaptation", label: "Adaptation PMR" },
  { value: "location-vente", label: "Location & vente" },
] as const;

export type ReservationServiceValue =
  (typeof reservationServices)[number]["value"];

export const transportServices: ReservationServiceValue[] = [
  "business",
  "quotidien",
  "vsl",
  "pmr",
];

export const reservation = {
  meta: {
    title: "Réserver un taxi ou demander un devis | MBT Taxis",
    description:
      "Choisissez votre service et envoyez une demande de taxi, VSL, PMR, adaptation, location ou vente à MBT Taxis.",
  },
  hero: {
    eyebrow: "Réservations et demandes",
    title: "Dites-nous ce dont vous avez besoin.",
    text: "Choisissez votre service. Le formulaire s’adapte automatiquement et transmet à notre équipe les informations nécessaires pour préparer votre demande.",
  },
  form: {
    id: "formulaire-reservation",
    title: "Votre demande",
    intro: "Remplissez les champs ci-dessous. Nous vous confirmons la suite rapidement.",
    note: "La réservation n’est définitive qu’après confirmation de la disponibilité par MBT.",
    submitTransport: "Envoyer ma demande de réservation",
    submitAdaptation: "Demander mon devis d’adaptation",
    submitLocation: "Envoyer ma demande",
    successTitle: "Votre demande a bien été envoyée.",
    successText:
      "Nous vous contacterons rapidement pour confirmer la disponibilité et les modalités.",
    consent:
      "J’accepte que MBT utilise ces informations pour traiter ma demande.",
  },
  urgent: {
    title: "Besoin d’une réponse rapide ?",
    text: "Pour une demande urgente pendant les heures d’ouverture, appelez directement notre centrale.",
    cta: `Appeler le ${site.phone}`,
    phone: site.phone,
    phoneHref: site.phoneHref,
  },
  /** Page dédiée Taxi PMR (route historique /reservation-tpmr) */
  pmrPage: {
    meta: {
      title: "Taxi PMR à Bruxelles — Réservation | MBT Taxis",
      description:
        "Réservez un taxi adapté, confortable et accessible pour vos trajets en fauteuil roulant à Bruxelles.",
    },
    hero: {
      title: "Un taxi adapté, confortable et accessible.",
      subtitle:
        "Nos taxis PMR accueillent les personnes en fauteuil roulant. Chauffeurs formés, prise en charge respectueuse et sécurisée.",
      primaryCta: "Réserver un taxi PMR",
      primaryHref: "/reservation?service=pmr",
      secondaryCta: "Réserver avec Handycab",
      secondaryHref: site.handycabBooking,
    },
    features: {
      title: "Un service pensé pour vous",
      intro:
        "Nous mettons tout en œuvre pour vous garantir des déplacements sûrs, confortables et sans stress.",
      items: [
        {
          title: "Véhicules adaptés",
          text: "Nos taxis PMR sont spécialement équipés pour accueillir les personnes en fauteuil roulant. L’accès est facilité et le confort est assuré tout au long du trajet.",
        },
        {
          title: "Chauffeurs formés",
          text: "Nos chauffeurs sont formés à l’accompagnement des personnes à mobilité réduite. Ils assurent une prise en charge respectueuse, humaine et attentive.",
        },
        {
          title: "Trajets du quotidien",
          text: "Rendez-vous médicaux, démarches administratives, sorties, gares et aéroports : nous nous adaptons à votre destination.",
        },
        {
          title: "Handycab",
          text: "Pour une course immédiate ou planifiée, utilisez aussi la plateforme et l’application Handycab.",
        },
      ],
    },
    zones: {
      title: "Zones desservies",
      text: "Nous assurons vos déplacements en taxi PMR à Bruxelles et dans ses environs — trajets en ville, rendez-vous médicaux, transferts vers les gares, hôpitaux ou aéroports.",
      mapBlocked:
        "Vous devez accepter les cookies facultatifs pour visualiser le contenu interactif.",
    },
  },
} as const;
