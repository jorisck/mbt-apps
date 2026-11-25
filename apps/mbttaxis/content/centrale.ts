import { site } from "./site";

export const centrale = {
  meta: {
    title: "Centrale téléphonique MBT — Une équipe vous répond",
    description:
      "Appelez la centrale MBT pour organiser un taxi, un transport VSL, un trajet PMR ou une demande de mobilité.",
  },
  hero: {
    eyebrow: "Un service humain",
    title: "Vous appelez. Une personne vous répond.",
    text: "Pas de parcours compliqué : la centrale MBT écoute votre besoin, identifie le bon service et vous aide à organiser votre déplacement — taxi, VSL, PMR ou autre demande de mobilité.",
    primaryCta: `Appeler le ${site.phoneShort}`,
    primaryHref: site.phoneHref,
    secondaryCta: "Nous écrire",
    secondaryHref: "/contactus",
  },
  presentation: {
    title: "Le point de contact qui relie tous nos services.",
    text: "Vous n’avez pas besoin de connaître le nom exact du service dont vous avez besoin. Expliquez simplement votre situation : notre équipe vous oriente vers la bonne solution.",
    note: "Un interlocuteur réel prend le temps de clarifier votre demande, vérifie les informations importantes et vous confirme les modalités avant d’organiser le trajet.",
    points: [
      "Une personne réelle au bout du fil, pas un automate.",
      "Orientation vers le bon service : taxi, VSL, PMR, adaptation ou location.",
      "Vérification des horaires, adresses et besoins d’accessibilité.",
      "Confirmation claire avant l’organisation définitive.",
      `Disponible ${site.hours}.`,
    ],
    cta: "Appeler maintenant",
    href: site.phoneHref,
  },
  role: {
    title: "Comment la centrale vous accompagne",
    intro:
      "De l’écoute à la confirmation, chaque appel suit le même principe : comprendre votre besoin, puis organiser la suite avec précision.",
    items: [
      {
        title: "Un interlocuteur réel",
        text: "Une personne prend connaissance de votre demande, répond à vos questions et clarifie les besoins particuliers.",
      },
      {
        title: "Une organisation précise",
        text: "Départ, destination, heure, fauteuil, accompagnant et contraintes spécifiques : les informations importantes sont vérifiées avec vous.",
      },
      {
        title: "Une confirmation claire",
        text: "La disponibilité et les modalités du service vous sont confirmées avant l’organisation définitive du trajet.",
      },
    ],
  },
  details: {
    title: "Coordonnées",
    phone: site.phone,
    phoneHref: site.phoneHref,
    hoursLabel: "Horaires",
    hours: site.hours,
    email: site.email,
    address: `${site.address.street}\n${site.address.postalCode} ${site.address.city}`,
    addressLine: site.address.full,
    cta: "Appeler maintenant",
  },
  prepare: {
    title: "Avant d’appeler",
    intro:
      "Pour que nous puissions vous répondre plus vite, préparez ces informations utiles :",
    items: [
      "La date et l’heure souhaitées.",
      "L’adresse de départ et la destination.",
      "Le nombre de passagers.",
      "Le type de fauteuil et les besoins d’accompagnement.",
      "Un numéro où vous joindre pour la confirmation.",
    ],
    cta: "Préparer ma demande en ligne",
    href: "/reservation",
  },
  faq: {
    title: "Questions fréquentes",
    items: [
      {
        q: "La centrale est-elle disponible 24h/24 ?",
        a: "Les horaires actuellement publiés sont du lundi au vendredi, de 8h à 17h. Pour une demande urgente pendant ces heures, appelez directement afin de vérifier la disponibilité.",
      },
      {
        q: "Dois-je appeler pour réserver un taxi PMR ?",
        a: "Vous pouvez appeler la centrale, utiliser le formulaire MBT ou réserver via la plateforme Handycab. Choisissez le canal le plus simple pour vous.",
      },
      {
        q: "Puis-je demander un devis pour une adaptation ?",
        a: "Oui. Sélectionnez « Adaptation PMR » dans le formulaire ou appelez la centrale en indiquant la marque, le modèle du véhicule et votre besoin.",
      },
    ],
  },
  finalCta: {
    title: "Une question, un trajet, un doute ?",
    text: "Appelez la centrale : une personne vous répond et vous oriente.",
    cta: `Appeler le ${site.phoneShort}`,
    href: site.phoneHref,
  },
} as const;
