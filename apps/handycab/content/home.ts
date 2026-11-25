import { site } from "./site";

export const home = {
  seo: {
    title: "Handycab — Réserver un taxi PMR à Bruxelles",
    description:
      "Commandez immédiatement ou planifiez un taxi adapté PMR à Bruxelles avec Handycab. Réservation sur le web, l’application mobile ou par téléphone.",
  },
  topBar:
    "Besoin d’aide pour réserver ? Appelez le +32 (0)2 315 31 00.",
  hero: {
    eyebrow: "Le taxi adapté à Bruxelles",
    title: "Votre taxi PMR,",
    titleAccent: "en quelques gestes.",
    body: "Commandez maintenant ou planifiez votre trajet avec un taxi adapté aux personnes à mobilité réduite. Handycab vous permet de réserver sur le web, depuis l’application ou par téléphone.",
    ctaPrimary: "Réserver un taxi adapté",
    ctaSecondary: "Comment ça marche ?",
    ctaPhone: `Appeler le ${site.phone}`,
    badges: [
      "Taxis officiellement autorisés",
      "Chauffeurs formés PMR",
      "Commande immédiate ou planifiée",
      "Paiement à bord",
    ],
    heroImage: {
      src: "/images/EDA_4380.jpg",
      alt: "Taxi adapté Handycab pour personnes à mobilité réduite à Bruxelles",
      caption: "Service PMR Bruxelles",
      vehicle: "Taxi adapté & autorisé",
      detail:
        "Réservation web, application ou téléphone — même simplicité qu’un taxi classique.",
    },
  },
  reassurance: [
    {
      icon: "accessible" as const,
      title: "Un véhicule adapté",
      body: "Des taxis conçus pour accueillir les personnes à mobilité réduite et faciliter leurs déplacements.",
      label: "Accès & confort",
      accent: true,
    },
    {
      icon: "user" as const,
      title: "Un chauffeur formé",
      body: "Des chauffeurs ayant suivi une formation orientée conduite, accueil et sécurité PMR.",
      label: "Formation PMR",
      accent: false,
    },
    {
      icon: "shield" as const,
      title: "Un tarif réglementé",
      body: "Le passager d’un taxi adapté paie le même tarif à la course qu’un usager d’un taxi ordinaire, conformément aux informations publiées par handicap.brussels.",
      label: "Tarif taxi classique",
      accent: false,
    },
    {
      icon: "check" as const,
      title: "Plusieurs moyens de paiement",
      body: "Espèces, Bancontact, Mastercard ou Visa directement dans le véhicule.",
      label: "Paiement à bord",
      accent: true,
    },
  ],
  bookWays: {
    eyebrow: "Simple du départ à l’arrivée",
    title: "Trois façons de commander votre taxi PMR.",
    items: [
      {
        icon: "calc" as const,
        title: "Réservation en ligne",
        body: "Utilisez la plateforme Handycab depuis votre téléphone, votre tablette ou votre ordinateur.",
        cta: "Réserver sur le web",
        href: site.bookingUrl,
        external: true,
      },
      {
        icon: "phone" as const,
        title: "Application mobile",
        body: "Téléchargez Handycab gratuitement sur Android ou iPhone et organisez vos trajets depuis l’application.",
        cta: "Télécharger l’application",
        href: "/application",
        external: false,
      },
      {
        icon: "heart" as const,
        title: "Réservation par téléphone",
        body: "Vous préférez parler à quelqu’un ? Appelez notre ligne dédiée afin d’être accompagné dans votre demande.",
        cta: `Appeler le ${site.phone}`,
        href: site.phoneHref,
        external: false,
      },
    ],
  },
  steps: {
    title: "Votre trajet, étape par étape.",
    items: [
      {
        step: "1",
        title: "Indiquez votre départ",
        body: "Saisissez l’adresse où le chauffeur doit venir vous chercher.",
      },
      {
        step: "2",
        title: "Ajoutez votre destination",
        body: "Indiquez votre adresse d’arrivée et les informations utiles à votre prise en charge.",
      },
      {
        step: "3",
        title: "Choisissez le moment",
        body: "Commandez un taxi immédiatement ou planifiez votre trajet pour une date et une heure précises.",
      },
      {
        step: "4",
        title: "Confirmez votre commande",
        body: "Vérifiez les informations du trajet et envoyez votre demande depuis la plateforme ou l’application.",
      },
    ],
    cta: "Commander mon taxi PMR",
  },
  trips: {
    eyebrow: "Votre mobilité au quotidien",
    title:
      "Un taxi adapté pour vos déplacements personnels, médicaux ou professionnels.",
    items: [
      {
        icon: "heart" as const,
        title: "Rendez-vous médicaux",
        body: "Rejoignez un hôpital, un cabinet, un centre de soins ou une séance de rééducation.",
      },
      {
        icon: "pin" as const,
        title: "Vie quotidienne",
        body: "Courses, démarches administratives, visite à un proche ou déplacement en ville.",
      },
      {
        icon: "star" as const,
        title: "Sorties et loisirs",
        body: "Restaurant, événement, activité culturelle ou sortie familiale.",
      },
      {
        icon: "user" as const,
        title: "Travail et rendez-vous",
        body: "Déplacement professionnel, réunion, formation ou rendez-vous administratif.",
      },
      {
        icon: "car" as const,
        title: "Gares et aéroports",
        body: "Planifiez votre transfert en précisant vos besoins et vos éventuels bagages.",
      },
    ],
    cta: "Planifier mon trajet",
  },
  app: {
    eyebrow: "Handycab sur votre téléphone",
    title: "Votre mobilité accessible, toujours à portée de main.",
    body: "L’application Handycab vous permet d’organiser un trajet adapté depuis votre smartphone, que votre course soit immédiate ou prévue à l’avance.",
    features: [
      {
        icon: "phone" as const,
        title: "Réservation mobile",
        body: "Réservation depuis votre téléphone.",
      },
      {
        icon: "pin" as const,
        title: "Adresses claires",
        body: "Adresse de départ et destination clairement identifiées.",
      },
      {
        icon: "clock" as const,
        title: "Immédiat ou planifié",
        body: "Course immédiate ou planifiée.",
      },
      {
        icon: "sync" as const,
        title: "Multi-appareils",
        body: "Disponible sur Android, iPhone et iPad.",
      },
    ],
  },
  mission: {
    eyebrow: "La mobilité est un droit",
    title: "Se déplacer ne devrait jamais être un parcours d’obstacles.",
    body: "Handycab a été imaginé pour simplifier la recherche et la réservation d’un taxi adapté à Bruxelles. Notre objectif est de donner plus d’autonomie aux personnes à mobilité réduite et davantage de sérénité à leurs proches.",
    ctaPrimary: "Découvrir notre mission",
    ctaSecondary: "Réserver maintenant",
  },
  cta: {
    title: "Où souhaitez-vous aller ?",
    body: "Commandez votre taxi adapté maintenant ou planifiez votre prochain déplacement.",
    primary: "Réserver un taxi adapté",
    secondary: `Appeler le ${site.phone}`,
  },
  faq: {
    title: "Questions fréquentes",
    intro: "Les réponses essentielles avant de commander votre taxi PMR.",
    items: [
      {
        q: "Handycab, c’est quoi exactement ?",
        a: "Handycab est une plateforme qui permet de commander immédiatement ou de planifier un taxi adapté aux personnes à mobilité réduite à Bruxelles, via le web, l’application ou le téléphone.",
      },
      {
        q: "Comment réserver un taxi adapté ?",
        a: "Vous pouvez réserver sur la plateforme en ligne, depuis l’application mobile Handycab, ou en appelant le +32 (0)2 315 31 00 pour une assistance humaine.",
      },
      {
        q: "Le taxi adapté coûte-t-il plus cher ?",
        a: "Selon handicap.brussels, une personne utilisant un taxi adapté paie le même tarif à la course qu’un utilisateur d’un taxi ordinaire.",
      },
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: "Espèces, Bancontact, Mastercard ou Visa, directement dans le véhicule équipé d’un terminal de paiement.",
      },
      {
        q: "Puis-je commander immédiatement ou seulement à l’avance ?",
        a: "Les deux sont possibles : commande immédiate selon disponibilité, ou course planifiée pour une date et une heure précises.",
      },
    ],
  },
} as const;
