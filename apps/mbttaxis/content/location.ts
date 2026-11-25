export const location = {
  meta: {
    title: "Location & vente de véhicules professionnels | MBT",
    description:
      "MBT propose à la location ou à la vente des véhicules issus de sa flotte professionnelle, avec suivi technique et historique d’entretien.",
  },
  intro: {
    title: "Des véhicules professionnels avec un historique connu.",
    paragraphs: [
      "Forte de plus de trente ans d’expérience dans le transport de personnes, MBT propose à la location ou à la vente certains véhicules de sa flotte professionnelle.",
      "Les véhicules mis à disposition ont bénéficié d’un suivi technique régulier. Lorsqu’un véhicule est proposé à la vente, son état, son kilométrage, ses caractéristiques et son historique sont présentés de manière transparente.",
    ],
  },
  sale: {
    title: "Véhicules disponibles",
    paragraphs: [
      "Dans le cadre du renouvellement régulier de notre flotte, MBT propose à la vente des véhicules ayant servi à nos activités professionnelles.",
      "Chaque véhicule est entretenu avec soin et dispose d’un historique complet.",
    ],
    vehicle: {
      name: "Škoda Octavia",
      price: "Prix sur demande",
      description:
        "Škoda berline noire 5 portes, élégante et confortable. Véhicule soigneusement entretenu, prêt à prendre la route.",
      cta: "Contacter le service location et vente",
      ctaHref: "/reservation?service=location-vente",
      footer: "Véhicule fiable et contrôlé",
      specs: [
        "Euro 6",
        "Boîte manuelle",
        "Diesel",
        "240 000 km",
        "Puissance 66,00 kW",
        "Première immatriculation 10/10/2018",
      ],
      images: [
        "/images/vehicle-1.jpg",
        "/images/vehicle-2.jpg",
        "/images/vehicle-3.jpg",
      ],
    },
  },
  cta: {
    primary: "Voir les véhicules disponibles",
    secondary: "Envoyer une demande",
    secondaryHref: "/reservation?service=location-vente",
  },
} as const;
