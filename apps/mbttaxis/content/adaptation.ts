export const adaptation = {
  meta: {
    title: "Adaptation PMR — Rendez votre véhicule accessible | MBT",
    description:
      "MBT transforme des véhicules classiques pour permettre l’accès et le transport d’une personne en fauteuil roulant.",
  },
  hero: {
    title: "Rendez votre véhicule accessible.",
    paragraphs: [
      "MBT transforme des véhicules classiques afin de permettre l’accès et le transport d’une personne en fauteuil roulant.",
      "Chaque projet tient compte du véhicule, du fauteuil, de la fréquence d’utilisation et des besoins de la personne transportée.",
    ],
    cta: "Demander un devis d’adaptation",
    ctaHref: "/reservation?service=adaptation",
  },
  expertise: {
    title: "L’expertise au service de votre mobilité",
    cards: [
      {
        title: "L’adaptation, au-delà de l’équipement",
        text: "L’adaptation ne se limite pas à l’installation d’un équipement. Notre équipe analyse votre demande et vous propose une solution compatible, fiable et durable, conçue pour améliorer le quotidien.",
      },
      {
        title: "Des adaptations fiables et sécurisées",
        text: "Abaissement du plancher, rampe d’accès, aménagement intérieur, sécurisation du fauteuil et accompagnement dans les démarches techniques et d’homologation : chaque transformation est réalisée dans un souci constant de sécurité.",
      },
    ],
  },
  form: {
    id: "devis-personnalise",
    title: "Devis personnalisé",
    intro:
      "Parlez-nous de votre projet d’adaptation PMR. Notre équipe vous accompagne et vous propose une solution sur mesure.",
    submit: "Demander mon devis d’adaptation",
    successTitle: "Votre demande de devis a été enregistrée.",
    successText: "Nous vous recontacterons dans les plus brefs délais.",
  },
  commitments: {
    title: "Nos engagements",
    intro:
      "Depuis 2016, l’adaptation de véhicules est un métier interne chez MBT, au service d’une mobilité plus accessible.",
    items: [
      {
        title: "Expertise internalisée",
        text: "Formation spécialisée auprès de Tripod Mobility et transformations réalisées par notre équipe pour un suivi cohérent du projet.",
        icon: "trophy",
      },
      {
        title: "Entretien & suivi",
        text: "Un accompagnement technique pour des adaptations durables, fiables et adaptées à l’usage réel du véhicule.",
        icon: "wrench",
      },
      {
        title: "Homologation & conformité",
        text: "Accompagnement dans les démarches techniques et d’homologation pour un véhicule conforme et sécurisé.",
        icon: "shield",
      },
    ],
  },
} as const;
