export const tarifs = {
  meta: {
    title: "Tarifs VSL | mbttaxis",
    description:
      "Grille tarifaire 2026 du transport médico-sanitaire MBT Taxis (arrêté 2013/1654), TVAC.",
  },
  hero: {
    title: "Transport médico-sanitaire",
    paragraphs: [
      "Notre service de transport médico-sanitaire est certifié TPMR et agréé. Nous assurons des déplacements médicaux non urgents dans le respect des normes en vigueur, avec des véhicules adaptés et un accompagnement sécurisé.",
      "Nos chauffeurs, formés et expérimentés, veillent au confort et à la sécurité de chaque patient, pour des trajets sereins vers les centres de soins, hôpitaux et consultations.",
    ],
    cta: "Voir les tarifs",
    ctaHref: "#grille-tarifaire",
  },
  grid: {
    id: "grille-tarifaire",
    title: "Notre grille tarifaire",
    intro: [
      "Depuis le 1er mai 2024, les tarifs en matière de transport médico-sanitaire ont été fixés. Une indexation de ces tarifs doit être réalisée début janvier de chaque année selon l'indice santé.",
      "Les tarifs indexés pour 2026 sont les suivants (arrêté 2013/1654) :",
    ],
    vehicle: {
      name: "Véhicule sanitaire léger",
      price: "63,32 €",
      priceNote: "/ tarif de base",
      description:
        "Tarifs applicables aux véhicules sanitaires légers pour le transport assis de patients ne nécessitant pas de surveillance intensive.",
      cta: "Réserver ce véhicule",
      ctaHref: "/reservation-tpmr",
    },
    lines: [
      { label: "Km supplémentaire entre 11 et 30 km", value: "2,11 € / km" },
      { label: "Km supplémentaire à partir du 31e km", value: "1,06 € / km" },
      {
        label: "Nuit — transport majoré entre 20 h et 06 h",
        value: "75,98 €",
      },
      {
        label: "Annulation tardive moins de 2 h avant le rendez-vous",
        value: "31,66 €",
      },
    ],
    vatNote: "Tous les tarifs sont TVAC",
    footerNote: "Transport assis",
  },
} as const;
