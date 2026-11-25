export const location = {
  meta: {
    title: "Location & Vente | mbttaxis",
    description:
      "Location et vente de véhicules professionnels issus de la flotte MBT.",
  },
  intro: {
    title: "Location et vente de véhicules professionnels",
    paragraphs: [
      "Forts de plus de 30 ans d'expérience dans le transport de personnes et la mobilité PMR, MBT.sa met à disposition son expertise à travers un service de location et de vente de véhicules.",
      "Tous les véhicules proposés proviennent de notre flotte professionnelle et bénéficient d'un suivi technique rigoureux.",
    ],
  },
  sale: {
    title: "Véhicules d'occasion à vendre",
    paragraphs: [
      "Dans le cadre du renouvellement régulier de notre flotte, MBT.sa propose à la vente des véhicules ayant servi à nos activités professionnelles.",
      "Chaque véhicule est entretenu avec soin et dispose d'un historique complet.",
    ],
    vehicle: {
      name: "Škoda Octavia",
      price: "Prix sur demande",
      description:
        "Škoda berline noire 5 portes, élégante et confortable. Véhicule soigneusement entretenu, prêt à prendre la route.",
      cta: "Contacter le service vente",
      ctaHref: "/contactus",
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
} as const;
