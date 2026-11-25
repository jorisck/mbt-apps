import { site } from "./site";

export const handycab = {
  meta: {
    title: "Handycab — Réserver un taxi PMR à Bruxelles | MBT",
    description:
      "Commandez immédiatement ou planifiez un taxi PMR à Bruxelles avec la plateforme et l’application Handycab.",
  },
  hero: {
    eyebrow: "Application de taxi PMR",
    title: "Handycab. Le taxi adapté en quelques gestes.",
    text: "Une plateforme bruxelloise entièrement consacrée à la mobilité des personnes à mobilité réduite. Commandez immédiatement un taxi adapté, ou planifiez votre trajet depuis l’application et la plateforme web.",
    primaryCta: "Réserver avec Handycab",
    primaryHref: site.handycabUrl,
    secondaryCta: `Appeler le ${site.handycabPhoneShort}`,
    secondaryHref: site.handycabPhoneHref,
  },
  presentation: {
    title: "Une application simple pour un besoin essentiel.",
    text: "Handycab centralise l’offre de taxis adaptés à Bruxelles. Depuis l’application ou la plateforme web, l’utilisateur indique son adresse de départ, sa destination et le moment souhaité pour son trajet.",
    note: "La réservation peut concerner une course immédiate ou un déplacement planifié. L’objectif est simple : rendre la mobilité accessible sans parcours compliqué.",
    points: [
      "Taxis adaptés aux personnes en fauteuil roulant.",
      "Chauffeurs formés à la conduite et à la sécurité PMR.",
      "Commandes immédiates ou planifiées.",
      "Paiement en espèces, Bancontact, Mastercard ou Visa.",
      "Ligne téléphonique dédiée pour être accompagné.",
    ],
    cta: "Ouvrir la réservation Handycab",
    href: site.handycabUrl,
  },
  steps: {
    title: "Réserver en trois étapes",
    intro:
      "Que vous soyez à l’aise avec le numérique ou que vous préfériez être guidé, Handycab reste simple à utiliser.",
    items: [
      {
        step: "1",
        title: "Indiquez votre trajet",
        text: "Adresse de départ, destination et moment souhaité : course immédiate ou trajet planifié.",
      },
      {
        step: "2",
        title: "Confirmez votre demande",
        text: "Un taxi adapté est proposé selon la disponibilité. Vous validez en quelques gestes.",
      },
      {
        step: "3",
        title: "Voyagez sereinement",
        text: "Un chauffeur formé à l’accompagnement PMR assure une prise en charge attentive et sécurisée.",
      },
    ],
  },
  audience: {
    title: "Pour qui est Handycab ?",
    text: "Handycab s’adresse aux personnes à mobilité réduite qui ont besoin d’un taxi adapté à Bruxelles, ainsi qu’à leurs proches et accompagnants.",
    items: [
      {
        title: "Personnes en fauteuil roulant",
        text: "Des véhicules adaptés pour voyager confortablement, en sécurité, sans dépendre d’une solution improvisée.",
      },
      {
        title: "Proches et accompagnants",
        text: "Réservez pour un proche, préparez le trajet à l’avance et gardez un interlocuteur en cas de besoin.",
      },
      {
        title: "Trajets du quotidien",
        text: "Rendez-vous médicaux, démarches, sorties, gares ou aéroports : Handycab couvre les déplacements essentiels.",
      },
    ],
  },
  apps: {
    title: "Télécharger l’application",
    intro:
      "Préférez l’application mobile ? Handycab est disponible gratuitement sur Android et iOS. Vous pouvez aussi réserver directement en ligne.",
    android: {
      title: "Application Android",
      text: "Téléchargez gratuitement Handycab depuis Google Play et réservez un taxi adapté depuis votre téléphone.",
      cta: "Télécharger sur Google Play",
      href: site.handycabUrl,
    },
    ios: {
      title: "Application iPhone et iPad",
      text: "Retrouvez Handycab sur l’App Store pour commander ou planifier un trajet adapté.",
      cta: "Télécharger sur l’App Store",
      href: site.handycabUrl,
    },
  },
  help: {
    title: "Besoin d’aide pour réserver ?",
    text: "Si vous préférez parler à quelqu’un, la ligne Handycab reste disponible pour vous accompagner dans votre demande.",
    phone: site.handycabPhone,
    phoneHref: site.handycabPhoneHref,
    phoneCta: `Appeler le ${site.handycabPhoneShort}`,
    alt: "Vous pouvez aussi passer par la centrale MBT pour une orientation plus large sur nos services.",
    altCta: "Contacter la centrale MBT",
    altHref: "/centrale",
  },
  faq: {
    title: "Questions fréquentes",
    items: [
      {
        q: "Puis-je réserver une course immédiate ?",
        a: "Oui. Handycab permet de commander immédiatement un taxi adapté, ou de planifier un trajet à l’avance selon vos besoins.",
      },
      {
        q: "Les véhicules sont-ils adaptés aux fauteuils roulants ?",
        a: "Oui. Handycab référence des taxis adaptés et autorisés, avec des chauffeurs formés à la conduite et à la sécurité PMR.",
      },
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: "Vous pouvez payer en espèces, par Bancontact, Mastercard ou Visa.",
      },
      {
        q: "Que faire si je ne suis pas à l’aise avec l’application ?",
        a: `Appelez le ${site.handycabPhoneShort} : une personne peut vous aider à organiser votre réservation.`,
      },
    ],
  },
  innovation: {
    title: "Une plateforme née à Bruxelles.",
    paragraphs: [
      "Créée par MBT en 2022, Handycab est la première plateforme bruxelloise entièrement dédiée à la réservation de taxis adaptés.",
      "Cette innovation a permis à MBT de recevoir le Prix CAP48 de l’entreprise citoyenne dans la catégorie Innovation.",
      "Derrière Handycab, c’est la même exigence que pour l’ensemble des services MBT : une mobilité accessible, humaine et bien organisée.",
    ],
    help: `Besoin d’aide pour réserver ? Appelez le ${site.handycabPhone}.`,
    helpHref: site.handycabPhoneHref,
  },
} as const;
