export const home = {
  hero: {
    badge: "Service spécialisé PMR • Bruxelles & Belgique",
    title: "HandyCab",
    subtitle: "La mobilité adaptée sans compromis.",
    body: "Service conventionné de transport pour personnes à mobilité réduite. Flotte de vans 100 % électriques à rampe douce, chauffeurs certifiés secouristes et accompagnement bienveillant de porte-à-porte.",
    ctaPrimary: "Réserver un véhicule PMR",
    ctaSecondary: "Appeler le dispatch 24/7",
    heroImage: {
      src: "/images/EDA_4380.jpg",
      alt: "Van TPMR HandyCab avec rampe et prise en charge fauteuil roulant à Bruxelles",
      caption: "Flotte 100 % adaptée Région Bruxelles-Capitale",
      vehicle: "Mercedes-Benz eVito TPMR électrique",
      detail:
        "Suspension pneumatique nivelante, rampe ultralégère basse et arrimage 4 points certifié.",
    },
  },
  pillars: [
    {
      icon: "shield",
      title: "100 % homologué TPMR",
      body: "Conforme à la norme européenne ISO 10542. Ancrages 4 points crash-testés et ceintures passagers à trois points.",
      label: "Sécurité certifiée",
      accent: false,
    },
    {
      icon: "heart",
      title: "Conventions mutuelles",
      body: "Prise en charge directe tiers-payant. Partenaire officiel des mutualités belges et hôpitaux de Bruxelles.",
      label: "Tiers-payant accepté",
      accent: true,
    },
    {
      icon: "user",
      title: "Chauffeurs dédiés",
      body: "Chauffeurs brevetés premiers secours BEPS. Formation continue à l’accueil des personnes en situation de handicap.",
      label: "Personnel qualifié",
      accent: false,
    },
    {
      icon: "clock",
      title: "Disponibilité 24/7",
      body: "Déploiement dans les 19 communes de Bruxelles et périphérie. Délai moyen de prise en charge inférieur à 15 min.",
      label: "Centrale active 24/7",
      accent: true,
    },
  ],
  fleet: {
    eyebrow: "Notre flotte dédiée",
    title: "Véhicules adaptés haut de gamme",
    intro:
      "Une flotte moderne Mercedes-Benz 100 % électrique conçue pour un confort acoustique remarquable et une sécurité sans concession.",
    main: {
      badge: "Mercedes-Benz eVito & EQV",
      status: "100 % électrique zéro émission",
      title: "Suspension pneumatique à abaissement automatique",
      body: "Grâce au plancher surbaissé et à la suspension pneumatique arrière qui s’abaisse à chaque arrêt, l’angle d’entrée est réduit au strict minimum pour une montée tout en douceur.",
      image: {
        src: "/images/EDA_4420.jpg",
        alt: "Intérieur adapté du van TPMR avec arrimages et plancher surbaissé",
        caption: "Arrimage 4 points Q'Straint & ceinture épaulière 3 points",
      },
      stats: [
        { label: "Pente douce", value: "< 11°", hint: "Accès fluide" },
        { label: "Treuil actif", value: "350 kg", hint: "Traction électrique" },
        { label: "Hauteur utile", value: "148 cm", hint: "Posture verticale" },
      ],
    },
    side: [
      {
        icon: "ramp",
        eyebrow: "Technologie de déploiement",
        title: "Rampe ultra-légère assistée",
        body: "Pente inférieure à 11 % pour un chargement sans secousse. Treuil électrique télécommandé pour les fauteuils motorisés lourds.",
        metaLabel: "Capacité de charge certifiée",
        metaValue: "Jusqu’à 400 kg",
      },
      {
        icon: "seat",
        eyebrow: "Espace & bien-être",
        title: "Sécurité & confort tri-zone",
        body: "Climatisation tri-zone, vitres athermiques pour l’intimité et espace généreux pour accueillir jusqu’à 4 accompagnants.",
        metaLabel: "Configuration passagers",
        metaValue: "1 fauteuil + 4 accompagnants",
      },
    ],
  },
  drivers: {
    eyebrow: "Accompagnement humain",
    title: "Chauffeurs qualifiés & secouristes certifiés",
    intro:
      "Le véhicule ne fait pas tout : l’écoute, le temps pris pour chaque patient et la courtoisie forment le cœur de notre engagement au quotidien.",
    items: [
      {
        initials: "JM",
        name: "Jean-Marc D.",
        role: "Chauffeur référent PMR • 9 ans d’expérience",
        rating: "4,98 / 5",
        rides: "1 240 courses",
        quote:
          "« Pour moi, la ponctualité devant la clinique ou le domicile est sacrée. On n’accompagne pas un simple passager : on accompagne une personne, avec dignité et sans précipitation. »",
        badge: "Brevet secourisme BEPS",
        note: "Accompagnement ascenseur inclus",
      },
      {
        initials: "FE",
        name: "Fatima E.",
        role: "Chauffeuse référente • 6 ans d’expérience",
        rating: "4,99 / 5",
        rides: "980 courses",
        quote:
          "« Beaucoup de nos usagers nous confient leurs trajets pour la dialyse ou la kinésithérapie chaque semaine. Nous tissons des liens de confiance avec eux et leurs familles. »",
        badge: "Bilingue FR / NL",
        note: "Agréée Région Bruxelles-Capitale",
      },
    ],
  },
  app: {
    eyebrow: "Application mobile & suivi sécurisé",
    title: "Suivi GPS en direct et partage en toute sérénité",
    body: "Conçue pour les usagers, leurs familles et les soignants. Visualisez l’approche exacte du van, recevez des notifications d’arrivée et partagez le lien de trajet sécurisé en un clic.",
    features: [
      {
        icon: "eye",
        title: "Mode gros caractères",
        body: "Interface à contraste élevé pensée pour les malvoyants et seniors.",
      },
      {
        icon: "share",
        title: "Partage famille & tuteurs",
        body: "Lien web instantané pour suivre la prise en charge sans installer d’app.",
      },
      {
        icon: "sync",
        title: "Courses récurrentes",
        body: "Planification automatique pour les rendez-vous d’oncologie ou dialyse.",
      },
      {
        icon: "phone",
        title: "Contact direct chauffeur",
        body: "Appel masqué en un appui dès l’assignation de la course.",
      },
    ],
  },
  cta: {
    badge: "Centrale de dispatch prioritaire PMR",
    title: "Besoin d’un transport adapté dans l’heure ?",
    body: "Nos régulateurs spécialisés sont à votre écoute 24 heures sur 24 pour organiser vos trajets urgents ou programmer vos séries de soins en toute sérénité.",
  },
} as const;
