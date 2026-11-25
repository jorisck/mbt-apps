export const about = {
  meta: {
    title: "À propos de MBT Taxis — Depuis 1991 à Bruxelles",
    description:
      "Découvrez l’histoire de MBT, son engagement dans le transport PMR, l’adaptation de véhicules et la création de Handycab.",
  },
  hero: {
    eyebrow: "Notre histoire",
    title: "Plus de trente ans à rendre la mobilité possible.",
    text: "Fondée à Bruxelles en 1991, MBT est passée du transport de personnes à un ensemble complet de solutions : taxi, PMR, VSL, adaptation de véhicules et Handycab.",
    primaryCta: "Contacter MBT",
    primaryHref: "/contactus",
    secondaryCta: "Découvrir nos services",
    secondaryHref: "/services",
  },
  who: {
    title: "Une entreprise bruxelloise devenue partenaire de mobilité.",
    paragraphs: [
      "MBT.sa — Société Bruxelloise de Taxis — accompagne les particuliers, les entreprises, les patients, les personnes à mobilité réduite et les professionnels du transport.",
      "Depuis sa création, l’entreprise a progressivement élargi son expertise pour répondre à des besoins que le taxi traditionnel ne couvre pas toujours.",
      "Cette évolution repose sur une idée simple : la mobilité ne devrait pas dépendre de l’âge, du handicap, du motif du déplacement ou de la complexité de son organisation.",
      "Plus qu’une compagnie de taxis, MBT est aujourd’hui un partenaire de mobilité capable d’intervenir dans le transport, l’accompagnement PMR et l’adaptation automobile.",
    ],
  },
  timeline: {
    title: "Chronologie",
    items: [
      {
        year: "1991",
        title: "Fondation à Bruxelles",
        text: "MBT.sa commence son activité dans le transport de personnes avec l’ambition d’offrir un service fiable et professionnel.",
      },
      {
        year: "2000",
        title: "Engagement dans le transport PMR",
        text: "MBT s’investit dans la mobilité des personnes à mobilité réduite et développe progressivement une flotte dédiée.",
      },
      {
        year: "2016",
        title: "L’adaptation devient un métier interne",
        text: "Après une formation spécialisée auprès de Tripod Mobility, MBT internalise la transformation de véhicules pour fauteuil roulant.",
      },
      {
        year: "2022",
        title: "Création de Handycab",
        text: "MBT lance la première plateforme bruxelloise dédiée à la réservation de taxis adaptés. Cette initiative est récompensée par un Prix CAP48 dans la catégorie Innovation.",
      },
      {
        year: "Aujourd’hui",
        title: "Un écosystème complet",
        text: "Taxi traditionnel, déplacements professionnels, transport PMR, VSL, adaptation, location et vente : les services sont réunis autour d’une même équipe.",
      },
    ],
  },
  /** Tuiles colorées 2×2 — design original conservé */
  highlightTiles: [
    { label: "Transporter avec confiance", tone: "muted" },
    { label: "Plus de 30 ans d’expertise", tone: "ink" },
    { label: "Des solutions adaptées à chacun", tone: "brand" },
    { label: "À l’écoute de vos besoins", tone: "muted" },
  ],
  finalCta: {
    title: "Depuis 1991, une même priorité : vous faire avancer.",
    primaryCta: "Nous contacter",
    primaryHref: "/contactus",
    secondaryCta: "Réserver un trajet",
    secondaryHref: "/reservation",
  },
} as const;
