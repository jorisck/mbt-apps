import { site } from "./site";

export const home = {
  meta: {
    title: "MBT Taxis — Taxi, PMR, VSL et mobilité à Bruxelles",
    description:
      "MBT Taxis organise vos trajets professionnels, quotidiens, PMR et médico-sanitaires à Bruxelles et en Belgique. Réservez en ligne ou appelez notre centrale.",
  },
  topBar: {
    text: `Centrale humaine — ${site.hours}`,
    cta: `Appeler le ${site.phone}`,
    ctaHref: site.phoneHref,
  },
  hero: {
    eyebrow: "Bruxelles · Belgique · Depuis 1991",
    title: "Une mobilité qui s’adapte à vous.",
    text: "Du trajet quotidien au transport PMR, du rendez-vous professionnel au déplacement médico-sanitaire : MBT coordonne la bonne solution, avec une véritable équipe disponible pour vous conseiller.",
    primaryCta: "Réserver maintenant",
    primaryHref: "/reservation",
    secondaryCta: "Parler à quelqu’un",
    secondaryHref: "/centrale",
    youtubeId: "KhuPKHfK2ZA",
    // Vidéo auto-hébergée (boucle sans coupure) ; remplace le lecteur YouTube.
    video: {
      webm: "/videos/handycab-1080.webm",
      mp4: "/videos/handycab-1080.mp4",
      poster: "/videos/handycab-poster.jpg",
    } as { webm: string; mp4: string; poster?: string } | undefined,
    badges: [
      "Transport médico-sanitaire agréé",
      "Véhicules adaptés PMR",
      "Centrale téléphonique humaine",
    ],
  },
  stats: [
    {
      value: "1991",
      label: "Depuis",
      text: "Entreprise bruxelloise de mobilité.",
    },
    {
      value: "30+",
      label: "Ans d’expérience",
      text: "Expertise construite sur le terrain.",
    },
    {
      value: "~30",
      label: "Véhicules adaptés",
      text: "Flotte dédiée aux déplacements PMR.",
    },
    {
      value: "6",
      label: "Solutions",
      text: "Transport, PMR et expertise auto.",
    },
  ],
  services: {
    id: "nos-services",
    eyebrow: "Une réponse à chaque besoin",
    title: "Bien plus qu’une compagnie de taxis.",
    intro:
      "MBT réunit transport, accompagnement PMR, mobilité médicale et expertise automobile. Vous choisissez votre besoin ; notre équipe organise la suite.",
    cards: [
      {
        title: "Vos déplacements professionnels partout en Belgique",
        eyebrow: "Taxi pour entreprises",
        text: "Réunions, transferts vers les gares et aéroports, visites de sites ou déplacements récurrents : MBT accompagne les entreprises avec un service professionnel et une organisation claire.",
        cta: "Découvrir le service",
        href: "/services/entreprises",
        image: "/images/audience-pmr.jpg",
      },
      {
        title: "Un taxi fiable pour tous vos déplacements",
        eyebrow: "Taxi au quotidien",
        text: "Rendez-vous, courses, sorties, visites familiales, gare ou aéroport : réservez simplement votre trajet avec MBT.",
        cta: "Découvrir le service",
        href: "/services/quotidien",
        image: "/images/engagements-pmr.jpg",
      },
      {
        title: "Transport médico-sanitaire assis",
        eyebrow: "Transport VSL",
        text: "MBT organise les déplacements médicaux non urgents vers les hôpitaux, centres de soins, consultations et établissements spécialisés.",
        cta: "Découvrir le service",
        href: "/services/vsl",
        image: "/images/vsl.webp",
      },
      {
        title: "Une mobilité accessible et respectueuse",
        eyebrow: "Taxi PMR",
        text: "Nos véhicules adaptés accueillent les personnes en fauteuil roulant. Nos chauffeurs sont formés pour assurer un accompagnement humain, sûr et attentif.",
        cta: "Découvrir le service",
        href: "/services/pmr",
        image: "/images/pmr.jpeg",
      },
      {
        title: "Transformez votre véhicule",
        eyebrow: "Adaptation PMR",
        text: "MBT adapte des véhicules classiques afin de les rendre accessibles aux personnes en fauteuil roulant. Chaque projet est étudié selon le modèle du véhicule et les besoins de son utilisateur.",
        cta: "Découvrir le service",
        href: "/services/adaptation",
        image: "/images/adaptation.webp",
      },
      {
        title: "Des véhicules professionnels entretenus et suivis",
        eyebrow: "Location & vente",
        text: "MBT propose à la location ou à la vente des véhicules issus de sa flotte professionnelle. Chaque véhicule bénéficie d’un suivi technique et d’un historique d’entretien.",
        cta: "Découvrir le service",
        href: "/services/location-vente",
        image: "/images/engagements-pmr.jpg",
      },
    ],
    footerCta: "Découvrir tous les services",
    footerHref: "/services",
  },
  why: {
    eyebrow: "Pourquoi MBT ?",
    title: "La bonne solution, au bon moment.",
    text: "Un besoin particulier ne devrait jamais vous obliger à chercher pendant des heures. Chez MBT, notre centrale écoute votre demande, clarifie vos besoins et vous dirige vers la solution adaptée.",
    points: [
      "Une équipe humaine pour organiser votre demande.",
      "Des chauffeurs attentifs aux besoins spécifiques.",
      "Des véhicules adaptés, suivis et entretenus.",
      "Une expérience bruxelloise de plus de trente ans.",
    ],
    primaryCta: "Appeler la centrale",
    primaryHref: site.phoneHref,
    secondaryCta: "Découvrir MBT",
    secondaryHref: "/about-us",
  },
  steps: {
    title: "Votre trajet en trois temps.",
    cta: "Réserver",
    ctaHref: "/reservation",
    items: [
      {
        step: "1",
        title: "Choisissez",
        text: "Sélectionnez le service qui correspond à votre déplacement ou à votre projet.",
      },
      {
        step: "2",
        title: "Précisez",
        text: "Indiquez l’horaire, les adresses et les éventuels besoins d’accessibilité. Notre centrale reste disponible pour vous aider.",
      },
      {
        step: "3",
        title: "Confirmez",
        text: "Notre équipe vérifie votre demande et vous confirme l’organisation du service.",
      },
    ],
  },
  handycab: {
    eyebrow: "Handycab par MBT",
    title: "Le taxi PMR, directement dans votre poche.",
    tagline: "Commandez immédiatement ou planifiez votre trajet",
    text: "Commandez immédiatement un taxi adapté ou planifiez votre trajet depuis l’application et la plateforme Handycab.",
    points: [
      "Commandes immédiates ou planifiées.",
      "Chauffeurs formés à la conduite et à la sécurité PMR.",
      "Véhicules adaptés et autorisés.",
      "Paiement en espèces, par Bancontact, Mastercard ou Visa.",
    ],
    primaryCta: "Utiliser Handycab",
    primaryHref: site.handycabBooking,
    secondaryCta: "Découvrir l’application",
    secondaryHref: "/handycab",
    cta: "Utiliser Handycab",
    href: site.handycabBooking,
  },
  finalCta: {
    title: "Un trajet à organiser ? Une personne vous répond.",
    primaryCta: `Appeler le ${site.phoneShort}`,
    primaryHref: site.phoneHref,
    primaryNote: site.hours,
    secondaryCta: "Réserver en ligne",
    secondaryHref: "/reservation",
    secondaryNote: "Toujours disponible",
  },
  testimonials: [
    {
      quote:
        "Un service très utile pour les personnes à mobilité réduite qui n’ont pas de famille pour les aider et les accompagner. Bravo pour cette belle initiative.",
      author: "Houria",
    },
    {
      quote: "Le seul à le faire sur Bruxelles, bravo !",
      author: "Tao",
    },
    {
      quote:
        "Mon grand souhait est qu’ils continuent de cette façon : nous avons besoin de gens comme vous, car pour les personnes qui ne savent pas se déplacer seules en fauteuil roulant, la vie n’est pas toujours facile.",
      author: "Marisa",
    },
  ],
} as const;
