export const tarifs = {
  meta: {
    title: "Transport VSL — Tarifs et organisation | MBT Taxis",
    description:
      "Transport médico-sanitaire assis agréé (n° 30.01.16). Organisez un VSL vers hôpitaux, consultations et centres de soins. Grille tarifaire 2026.",
  },
  hero: {
    title: "Un transport médico-sanitaire sûr et rassurant.",
    paragraphs: [
      "Notre service VSL assure le transport assis de patients qui doivent se rendre à un rendez-vous médical non urgent, sans nécessiter une surveillance médicale intensive pendant le trajet.",
      "Nos chauffeurs veillent au confort, à la sécurité et à la ponctualité de chaque passager. MBT dispose d’un agrément de transport médico-sanitaire n° 30.01.16.",
    ],
    cta: "Organiser un transport VSL",
    ctaHref: "/reservation?service=vsl",
  },
  destinations: {
    title: "Destinations habituelles",
    items: [
      "hôpitaux ;",
      "consultations médicales ;",
      "centres de soins ;",
      "séances de rééducation ;",
      "établissements spécialisés.",
    ],
  },
  grid: {
    id: "grille-tarifaire",
    title: "Notre grille tarifaire",
    intro: [
      "Depuis le 1er mai 2024, les tarifs en matière de transport médico-sanitaire ont été fixés. Une indexation de ces tarifs doit être réalisée début janvier de chaque année selon l’indice santé.",
      "Les tarifs indexés pour 2026 sont les suivants (arrêté 2013/1654) :",
    ],
    vehicle: {
      name: "Véhicule sanitaire léger",
      price: "63,32 €",
      priceNote: "/ tarif de base",
      description:
        "Tarifs applicables aux véhicules sanitaires légers pour le transport assis de patients ne nécessitant pas de surveillance intensive.",
      cta: "Organiser un transport VSL",
      ctaHref: "/reservation?service=vsl",
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
