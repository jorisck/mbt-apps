export const home = {
  meta: {
    title: "Accueil | mbttaxis",
    description:
      "MBT Taxis — transport, taxi PMR et VSL à Bruxelles. Un service adapté à tous vos besoins pour tous vos trajets.",
  },
  hero: {
    title: "MBT TAXIS®",
    subtitle: "Transport, Taxi PMR & VSL",
    text: "Un service adapté à tous vos besoins pour tous vos trajets.",
    cta: "Découvrez nos services",
    ctaHref: "#nos-services-pmr",
    youtubeId: "KhuPKHfK2ZA",
  },
  services: {
    id: "nos-services-pmr",
    title: "Nos services adaptés",
    intro:
      "Pour des déplacements en toute sécurité, avec des véhicules adaptés PMR et un accompagnement personnalisé.",
    cards: [
      {
        title: "Réservation taxis PMR",
        eyebrow: "Transport pour tous",
        text: "Nous assurons des trajets adaptés pour les personnes à mobilité réduite à Bruxelles et dans ses environs avec un service fiable, confortable et sécurisé.",
        cta: "Réserver un taxi PMR",
        href: "/reservation-tpmr",
        image: "/images/pmr.jpeg",
      },
      {
        title: "Transport VSL",
        eyebrow: "Transport médico-sanitaire",
        text: "Des véhicules adaptés, un accompagnement personnalisé et des tarifs transparents, validés par la Commission communautaire française.",
        cta: "Voir les tarifs",
        href: "/tarifs-vsl",
        image: "/images/vsl.webp",
      },
      {
        title: "Adaptation TPMR",
        eyebrow: "Transformation de qualité",
        text: "Nous transformons les voitures classiques en véhicules accessibles aux personnes en fauteuil roulant, en adaptant le plancher.",
        cta: "Adapter votre véhicule",
        href: "/adaptation-tpmr",
        image: "/images/adaptation.webp",
      },
    ],
  },
  audience: {
    title: "À qui s'adressent nos services ?",
    paragraphs: [
      "Nos services de transport sont spécialement conçus pour les personnes à mobilité réduite (PMR), les seniors et les patients nécessitant un accompagnement médicalisé. Nous accompagnons également leurs proches et accompagnants pour faciliter les déplacements vers les rendez-vous médicaux, les établissements de santé, les courses ou les sorties.",
      "Nous travaillons aussi avec les professionnels qui souhaitent proposer des véhicules adaptés ou organiser des trajets sécurisés pour leurs patients et collaborateurs.",
    ],
  },
  commitments: {
    title: "Nos engagements",
    paragraphs: [
      "Nous offrons un service de transport spécialisé PMR, avec des véhicules adaptés et un accompagnement personnalisé. Nos chauffeurs sont formés, professionnels et attentifs aux besoins spécifiques de chaque passager.",
      "Nous mettons un point d'honneur à garantir votre confort, votre sécurité et votre ponctualité, que ce soit pour un trajet médical, un rendez-vous quotidien ou une sortie.",
    ],
    cta: "Découvrez nos services de transport",
    ctaHref: "#nos-services-pmr",
  },
  handycab: {
    eyebrow: "Application MBT",
    title: "HandyCab",
    tagline: "Plateforme taxi entièrement dédiée à la mobilité des PMR",
    text: "HandyCab est l'application de MBT pour réserver des courses PMR à Bruxelles et en Belgique : véhicules adaptés, chauffeurs formés et réservation simple en quelques clics.",
    cta: "Découvrir HandyCab",
    href: "https://www.handycab.be",
  },
  testimonials: [
    {
      quote:
        "Un service très utile pour les personnes à mobilité réduite qui n'ont pas de famille pour les aider et les accompagner. Bravo pour cette belle initiative.",
      author: "Houria",
    },
    {
      quote: "Le seul à le faire sur Bruxelles, bravo !",
      author: "Tao",
    },
    {
      quote:
        "Mon grand souhait est qu'ils continuent de cette façon : nous avons besoin de gens comme vous, car pour les personnes qui ne savent pas se déplacer seules en fauteuil roulant, la vie n'est pas toujours facile.",
      author: "Marisa",
    },
  ],
} as const;
