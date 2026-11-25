import { site } from "./site";

export const serviceSlugs = [
  "entreprises",
  "quotidien",
  "vsl",
  "pmr",
  "adaptation",
  "location-vente",
] as const;

export type ServiceSlug = (typeof serviceSlugs)[number];

type ServicePage = {
  slug: ServiceSlug;
  meta: { title: string; description: string };
  hero: {
    eyebrow: string;
    title: string;
    text: string;
    primaryCta: string;
    primaryHref: string;
    secondaryCta: string;
    secondaryHref: string;
  };
  image: { src: string; alt: string };
  intro: {
    title: string;
    paragraphs: string[];
  };
  useCases: {
    title: string;
    intro: string;
    items: { title: string; text: string }[];
  };
  process: {
    title: string;
    intro: string;
    steps: { title: string; text: string }[];
  };
  advantages: {
    title: string;
    items: { title: string; text: string }[];
  };
  trust?: string;
  faq: {
    title: string;
    items: { q: string; a: string }[];
  };
  related: {
    title: string;
    slugs: ServiceSlug[];
  };
  finalCta: {
    title: string;
    text: string;
    primaryCta: string;
    primaryHref: string;
    secondaryCta: string;
    secondaryHref: string;
  };
};

export const servicePages: Record<ServiceSlug, ServicePage> = {
  entreprises: {
    slug: "entreprises",
    meta: {
      title: "Taxi pour entreprises en Belgique | MBT Taxis",
      description:
        "Organisez les déplacements professionnels de vos collaborateurs et visiteurs avec MBT : réunions, gares, aéroports et trajets récurrents en Belgique.",
    },
    hero: {
      eyebrow: "Taxi pour entreprises",
      title: "Des déplacements professionnels mieux organisés.",
      text: "MBT accompagne les entreprises bruxelloises et belges pour leurs transferts, rendez-vous et trajets récurrents — avec une centrale qui comprend vos contraintes d’agenda.",
      primaryCta: "Organiser un trajet professionnel",
      primaryHref: "/reservation?service=business",
      secondaryCta: `Appeler le ${site.phoneShort}`,
      secondaryHref: site.phoneHref,
    },
    image: {
      src: "/images/audience-pmr.jpg",
      alt: "Déplacement professionnel organisé par MBT",
    },
    intro: {
      title: "Un partenaire mobilité pour votre entreprise.",
      paragraphs: [
        "Quand un collaborateur doit rejoindre un client, qu’un visiteur arrive à la gare ou qu’une équipe se déplace pour un événement, le trajet ne doit pas devenir un sujet de stress.",
        "Depuis 1991, MBT organise des courses professionnelles fiables à Bruxelles et en Belgique. Vous indiquez le besoin ; notre centrale propose le véhicule adapté, confirme les horaires et assure le suivi.",
        "Facturation claire, interlocuteur dédié et ponctualité : le service est conçu pour les réalités du monde professionnel, pas seulement pour une course isolée.",
      ],
    },
    useCases: {
      title: "Pour quels déplacements ?",
      intro:
        "Le taxi entreprise MBT couvre les besoins ponctuels comme les flux réguliers.",
      items: [
        {
          title: "Réunions et rendez-vous",
          text: "Transferts porte-à-porte vers bureaux, sites industriels ou salles de réunion, avec une prise en charge à l’heure convenue.",
        },
        {
          title: "Gares et aéroports",
          text: "Accueil de visiteurs, départs anticipés et retours de mission depuis Bruxelles-Midi, Zaventem ou Charleroi.",
        },
        {
          title: "Événements et séminaires",
          text: "Coordination de plusieurs véhicules pour déposer ou récupérer des participants selon un planning partagé.",
        },
        {
          title: "Trajets récurrents",
          text: "Navettes entre sites, déplacements hebdomadaires de collaborateurs ou d’intervenants externes.",
        },
      ],
    },
    process: {
      title: "Comment ça se passe ?",
      intro: "Un parcours simple, pensé pour les assistantes de direction comme pour les managers en déplacement.",
      steps: [
        {
          title: "Vous formulez la demande",
          text: "Via le formulaire en ligne ou la centrale : date, horaires, adresses, nombre de passagers et contraintes particulières.",
        },
        {
          title: "Nous confirmons la prise en charge",
          text: "Un interlocuteur MBT valide la disponibilité et vous confirme les modalités avant le départ.",
        },
        {
          title: "Le trajet est suivi",
          text: "Le chauffeur assure une prise en charge professionnelle ; vous pouvez nous joindre en cas de changement de dernière minute.",
        },
      ],
    },
    advantages: {
      title: "Pourquoi confier vos trajets à MBT ?",
      items: [
        {
          title: "Organisation humaine",
          text: "Une vraie équipe répond, clarifie et oriente — utile quand le besoin sort du cadre d’une application grand public.",
        },
        {
          title: "Couverture belge",
          text: "Départs depuis Bruxelles et déplacements dans toute la Belgique selon disponibilité.",
        },
        {
          title: "Continuité avec nos autres services",
          text: "Besoin d’un véhicule PMR pour un collaborateur, d’un VSL médical ou d’un transfert mixte ? Tout reste chez le même partenaire.",
        },
        {
          title: "Plus de 30 ans d’expérience",
          text: "MBT connaît les réalités bruxelloises : accessibilité, timing aéroport, embouteillages et imprévus.",
        },
      ],
    },
    faq: {
      title: "Questions fréquentes",
      items: [
        {
          q: "Puis-je facturer sur compte entreprise ?",
          a: "Oui. Contactez la centrale pour ouvrir un compte ou définir les modalités de facturation adaptées à votre société.",
        },
        {
          q: "Le service est-il limité à Bruxelles ?",
          a: "Nous sommes basés à Molenbeek-Saint-Jean. Les départs depuis Bruxelles sont notre cœur d’activité ; les trajets vers ou depuis d’autres villes belges s’organisent selon disponibilité.",
        },
        {
          q: "Puis-je réserver plusieurs véhicules pour un même événement ?",
          a: "Oui. Indiquez le nombre de passagers et le planning souhaité : nous coordonnons la flotte nécessaire.",
        },
      ],
    },
    related: {
      title: "Services complémentaires",
      slugs: ["quotidien", "pmr", "vsl"],
    },
    finalCta: {
      title: "Prêt à organiser le prochain déplacement ?",
      text: "Décrivez votre besoin en ligne ou appelez la centrale : un conseiller MBT vous répond.",
      primaryCta: "Organiser un trajet professionnel",
      primaryHref: "/reservation?service=business",
      secondaryCta: "Contacter MBT",
      secondaryHref: "/contactus",
    },
  },

  quotidien: {
    slug: "quotidien",
    meta: {
      title: "Taxi au quotidien à Bruxelles | MBT Taxis",
      description:
        "Réservez un taxi fiable pour vos rendez-vous, courses, sorties, gares et aéroports à Bruxelles. MBT organise vos trajets du quotidien.",
    },
    hero: {
      eyebrow: "Taxi au quotidien",
      title: "Votre taxi pour tous les jours.",
      text: "Rendez-vous, courses, visite familiale, gare ou aéroport : MBT vous propose un trajet clair, ponctuel et simple à organiser — sans friction.",
      primaryCta: "Réserver un taxi",
      primaryHref: "/reservation?service=quotidien",
      secondaryCta: `Appeler le ${site.phoneShort}`,
      secondaryHref: site.phoneHref,
    },
    image: {
      src: "/images/engagements-pmr.jpg",
      alt: "Taxi MBT pour les déplacements du quotidien",
    },
    intro: {
      title: "Un taxi de confiance, pour la vie réelle.",
      paragraphs: [
        "Le quotidien ne se résume pas à une course improvisée. Parfois vous avez un créneau précis chez le médecin, un train à ne pas rater, des courses à faire avec des sacs, ou un parent à accompagner.",
        "MBT vous offre un service de taxi classique, pensé avec la même exigence que nos transports spécialisés : écoute, confirmation claire et chauffeur attentif.",
        "Vous choisissez le moment, le départ et la destination. Notre équipe se charge de trouver la solution adaptée et de vous confirmer la prise en charge.",
      ],
    },
    useCases: {
      title: "Des trajets qui collent à votre journée",
      intro: "Particuliers, seniors, familles ou personnes qui préfèrent planifier plutôt qu’improviser.",
      items: [
        {
          title: "Rendez-vous et démarches",
          text: "Médecin, administration, banque, notaire : arrivez à l’heure, sans chercher une place de parking.",
        },
        {
          title: "Sorties et visites",
          text: "Restaurant, spectacle, visite à un proche : un aller, un retour, ou les deux planifiés à l’avance.",
        },
        {
          title: "Gares et aéroports",
          text: "Transferts vers Bruxelles-Midi, l’aéroport de Bruxelles-National ou Charleroi, avec une marge horaire réaliste.",
        },
        {
          title: "Courses et accompagnement",
          text: "Idéal quand vous avez des sacs, des enfants, ou simplement besoin d’un trajet serein de porte à porte.",
        },
      ],
    },
    process: {
      title: "Réserver en trois étapes",
      intro: "Simple, humain, sans application obligatoire.",
      steps: [
        {
          title: "Indiquez votre trajet",
          text: "Départ, destination, date et heure souhaitée — en ligne ou par téléphone.",
        },
        {
          title: "Recevez une confirmation",
          text: "La centrale vérifie la disponibilité et vous confirme la prise en charge.",
        },
        {
          title: "Voyagez sereinement",
          text: "Le chauffeur vous récupère à l’adresse convenue et vous conduit à destination.",
        },
      ],
    },
    advantages: {
      title: "Ce qui change avec MBT",
      items: [
        {
          title: "Une centrale qui répond",
          text: "Vous parlez à une personne qui comprend votre besoin, y compris s’il évolue (fauteuil, accompagnant, bagages).",
        },
        {
          title: "Planification à l’avance",
          text: "Idéal pour les trajets importants : vous ne dépendez pas uniquement de la disponibilité du moment.",
        },
        {
          title: "Le même réseau que nos services PMR et VSL",
          text: "Si votre situation demande un véhicule adapté ou un transport médico-sanitaire, nous basculons vers le bon service.",
        },
        {
          title: "Ancrage local",
          text: "Entreprise bruxelloise depuis 1991, basée Rue des Béguines à Molenbeek-Saint-Jean.",
        },
      ],
    },
    faq: {
      title: "Questions fréquentes",
      items: [
        {
          q: "Dois-je réserver longtemps à l’avance ?",
          a: "Plus votre horaire est critique (train, avion, rendez-vous médical), plus nous recommandons de réserver tôt. Pour un trajet flexible, contactez-nous dès que possible pour vérifier la disponibilité.",
        },
        {
          q: "Puis-je réserver un aller-retour ?",
          a: "Oui. Précisez les deux horaires dans votre demande : nous organisons l’aller et le retour selon vos contraintes.",
        },
        {
          q: "Que faire si j’ai besoin d’un véhicule adapté ?",
          a: "Choisissez le service Taxi PMR ou Handycab. Si vous n’êtes pas sûr, appelez la centrale : elle vous oriente en quelques minutes.",
        },
      ],
    },
    related: {
      title: "Autres besoins ?",
      slugs: ["entreprises", "pmr", "vsl"],
    },
    finalCta: {
      title: "Réservez votre prochain trajet.",
      text: "Quelques informations suffisent. Notre équipe s’occupe du reste.",
      primaryCta: "Réserver un taxi",
      primaryHref: "/reservation?service=quotidien",
      secondaryCta: "Appeler la centrale",
      secondaryHref: site.phoneHref,
    },
  },

  vsl: {
    slug: "vsl",
    meta: {
      title: "Transport VSL à Bruxelles — Médico-sanitaire | MBT",
      description:
        "Transport médico-sanitaire assis (VSL) agréé COCOF pour vos rendez-vous médicaux non urgents à Bruxelles. Tarifs clairs, chauffeurs attentifs.",
    },
    hero: {
      eyebrow: "Transport VSL",
      title: "Un transport médico-sanitaire sûr et rassurant.",
      text: "MBT assure le transport assis de patients vers hôpitaux, consultations et centres de soins — avec agrément COCOF et une équipe formée au confort du trajet.",
      primaryCta: "Organiser un transport VSL",
      primaryHref: "/reservation?service=vsl",
      secondaryCta: "Voir les tarifs VSL",
      secondaryHref: "/tarifs-vsl",
    },
    image: {
      src: "/images/vsl.webp",
      alt: "Transport médico-sanitaire VSL MBT",
    },
    intro: {
      title: "Quand le trajet fait partie du soin.",
      paragraphs: [
        "Un rendez-vous médical non urgent ne doit pas se transformer en parcours du combattant. Le VSL (véhicule sanitaire léger) est conçu pour transporter un patient assis, en toute sécurité, sans surveillance médicale intensive pendant le trajet.",
        "Chez MBT, ce service s’inscrit dans plus de trente ans de mobilité bruxelloise et dans un agrément officiel de transport médico-sanitaire (n° 30.01.16).",
        "Ponctualité, douceur de conduite et respect du patient : nos chauffeurs savent que chaque minute compte avant une consultation, une séance de rééducation ou un examen.",
      ],
    },
    useCases: {
      title: "Destinations et situations fréquentes",
      intro: "Le VSL MBT couvre les déplacements médicaux non urgents les plus courants.",
      items: [
        {
          title: "Hôpitaux et cliniques",
          text: "Consultations, examens, bilans et suivis programmés dans les établissements bruxellois.",
        },
        {
          title: "Centres de soins et rééducation",
          text: "Séances régulières où la régularité du transport compte autant que le soin lui-même.",
        },
        {
          title: "Médecins et spécialistes",
          text: "Trajets vers cabinets médicaux, centres d’imagerie ou structures spécialisées.",
        },
        {
          title: "Établissements adaptés",
          text: "Déplacements vers maisons de repos, structures de jour ou services d’accompagnement.",
        },
      ],
    },
    process: {
      title: "Organiser un VSL avec MBT",
      intro: "Nous clarifions avec vous le besoin médical et les contraintes pratiques.",
      steps: [
        {
          title: "Décrivez le rendez-vous",
          text: "Date, heure, adresse de prise en charge, destination et éventuel accompagnant.",
        },
        {
          title: "Nous validons le type de transport",
          text: "La centrale confirme que le VSL est adapté (transport assis non urgent) et vous communique les modalités.",
        },
        {
          title: "Prise en charge soignée",
          text: "Le chauffeur assure un trajet calme et ponctuel, jusqu’à l’entrée de l’établissement si nécessaire.",
        },
      ],
    },
    advantages: {
      title: "Les garanties MBT",
      items: [
        {
          title: "Agrément COCOF",
          text: `Entreprise agréée transport médico-sanitaire — n° ${site.agreement}.`,
        },
        {
          title: "Tarifs publiés",
          text: "Consultez la grille tarifaire VSL 2026 sur notre page dédiée, pour une estimation transparente.",
        },
        {
          title: "Chauffeurs habitués aux contextes de soin",
          text: "Patience, discrétion et attention aux besoins du patient font partie du métier.",
        },
        {
          title: "Lien avec le taxi PMR",
          text: "Si un fauteuil roulant est nécessaire, nous orientons vers notre flotte PMR ou Handycab.",
        },
      ],
    },
    trust: `MBT dispose d’un agrément de transport médico-sanitaire n° ${site.agreement}.`,
    faq: {
      title: "Questions fréquentes",
      items: [
        {
          q: "Quelle est la différence entre VSL et taxi PMR ?",
          a: "Le VSL concerne le transport médico-sanitaire assis non urgent. Le taxi PMR est un véhicule adapté pour les personnes en fauteuil roulant, pour tout type de trajet. La centrale vous oriente si vous hésitez.",
        },
        {
          q: "Où consulter les tarifs ?",
          a: "La grille tarifaire officielle est disponible sur la page Tarifs VSL. Les montants sont TVAC et suivent l’arrêté applicable.",
        },
        {
          q: "Puis-je annuler un transport ?",
          a: "Oui. Prévenez-nous le plus tôt possible. Une annulation tardive peut entraîner des frais selon les conditions publiées sur la page tarifs.",
        },
      ],
    },
    related: {
      title: "Services liés",
      slugs: ["pmr", "quotidien", "entreprises"],
    },
    finalCta: {
      title: "Besoin d’un transport vers un rendez-vous médical ?",
      text: "Expliquez simplement la situation : nous organisons le VSL adapté.",
      primaryCta: "Organiser un transport VSL",
      primaryHref: "/reservation?service=vsl",
      secondaryCta: "Voir les tarifs",
      secondaryHref: "/tarifs-vsl",
    },
  },

  pmr: {
    slug: "pmr",
    meta: {
      title: "Taxi PMR à Bruxelles — Véhicules adaptés | MBT",
      description:
        "Réservez un taxi PMR à Bruxelles : véhicules adaptés fauteuil roulant, chauffeurs formés. Aussi via Handycab pour une réservation immédiate.",
    },
    hero: {
      eyebrow: "Taxi PMR",
      title: "Un taxi adapté, confortable et accessible.",
      text: "Véhicules équipés pour fauteuil roulant, chauffeurs formés et prise en charge respectueuse : MBT rend la mobilité accessible à Bruxelles depuis plus de vingt ans.",
      primaryCta: "Réserver un taxi PMR",
      primaryHref: "/reservation?service=pmr",
      secondaryCta: "Réserver avec Handycab",
      secondaryHref: site.handycabBooking,
    },
    image: {
      src: "/images/pmr.jpeg",
      alt: "Taxi PMR adapté fauteuil roulant MBT",
    },
    intro: {
      title: "La mobilité ne devrait jamais être un obstacle.",
      paragraphs: [
        "Se déplacer en fauteuil roulant à Bruxelles demande plus qu’un taxi classique : il faut un véhicule accessible, un chauffeur formé et une organisation qui anticipe l’accès, le temps d’embarquement et le confort du trajet.",
        "MBT s’est engagée dans le transport PMR dès 2000. Aujourd’hui, notre flotte adaptée et notre plateforme Handycab (lancée en 2022, Prix CAP48 Innovation) offrent deux façons simples de réserver.",
        "Que ce soit pour un rendez-vous médical, une sortie, une gare ou un aéroport, chaque trajet est pensé pour que la personne voyage dans la dignité et la sécurité.",
      ],
    },
    useCases: {
      title: "Exemples de trajets PMR",
      intro: "Privé, médical, administratif ou professionnel : le même standard d’attention.",
      items: [
        {
          title: "Rendez-vous médicaux",
          text: "Hôpitaux, spécialistes, centres de rééducation — avec le temps nécessaire pour un embarquement serein.",
        },
        {
          title: "Démarches et vie quotidienne",
          text: "Administrations, courses accompagnées, visites familiales ou activités de loisir.",
        },
        {
          title: "Gares et aéroports",
          text: "Transferts adaptés avec bagages et fauteuil, planifiés pour limiter le stress du voyage.",
        },
        {
          title: "Trajets professionnels",
          text: "Réunions, formations ou événements : une mobilité inclusive aussi pour le travail.",
        },
      ],
    },
    process: {
      title: "Deux façons de réserver",
      intro: "Choisissez le canal le plus simple pour vous.",
      steps: [
        {
          title: "Via MBT",
          text: "Formulaire en ligne ou centrale téléphonique : idéal pour planifier et préciser le type de fauteuil ou d’accompagnement.",
        },
        {
          title: "Via Handycab",
          text: "Application ou plateforme web pour une course immédiate ou planifiée, dédiée aux taxis adaptés bruxellois.",
        },
        {
          title: "Prise en charge adaptée",
          text: "Le chauffeur sécurise le fauteuil, vérifie le confort et conduit jusqu’à destination.",
        },
      ],
    },
    advantages: {
      title: "L’expertise PMR de MBT",
      items: [
        {
          title: "Véhicules réellement adaptés",
          text: "Rampes, espaces et ancrages conçus pour accueillir le fauteuil en sécurité.",
        },
        {
          title: "Chauffeurs formés",
          text: "Accompagnement, patience et gestes adaptés font partie de la prise en charge.",
        },
        {
          title: "Handycab, née chez MBT",
          text: "Première plateforme bruxelloise dédiée aux taxis PMR, récompensée par CAP48.",
        },
        {
          title: "Adaptation automobile aussi",
          text: "Besoin de rendre votre propre véhicule accessible ? Notre atelier Adaptation PMR est là.",
        },
      ],
    },
    faq: {
      title: "Questions fréquentes",
      items: [
        {
          q: "Faut-il un fauteuil pliable ?",
          a: "Non. Nos véhicules PMR sont conçus pour transporter le fauteuil avec le passager. Précisez le type de fauteuil (manuel, électrique, dimensions) lors de la réservation.",
        },
        {
          q: "Puis-je voyager avec un accompagnant ?",
          a: "Oui, dans la limite des places disponibles. Indiquez-le au moment de la réservation.",
        },
        {
          q: "Handycab ou centrale MBT ?",
          a: "Handycab convient pour réserver rapidement un taxi adapté. La centrale MBT est idéale si vous avez un besoin complexe ou souhaitez combiner plusieurs services.",
        },
      ],
    },
    related: {
      title: "Aller plus loin",
      slugs: ["adaptation", "vsl", "quotidien"],
    },
    finalCta: {
      title: "Réservez votre taxi PMR.",
      text: "En ligne, par téléphone ou via Handycab — à vous de choisir.",
      primaryCta: "Réserver un taxi PMR",
      primaryHref: "/reservation-tpmr",
      secondaryCta: "Découvrir Handycab",
      secondaryHref: "/handycab",
    },
  },

  adaptation: {
    slug: "adaptation",
    meta: {
      title: "Adaptation PMR de véhicules | MBT Adaptation",
      description:
        "MBT transforme des véhicules classiques en véhicules accessibles fauteuil roulant : rampe, plancher, sécurisation. Devis et expertise à Bruxelles.",
    },
    hero: {
      eyebrow: "Adaptation PMR",
      title: "Rendez votre véhicule accessible.",
      text: "Depuis 2016, MBT adapte des véhicules pour le transport en fauteuil roulant : une solution durable, étudiée au cas par cas, pour particuliers et professionnels.",
      primaryCta: "Demander un devis",
      primaryHref: "/adaptation-tpmr",
      secondaryCta: `Appeler le ${site.phoneShort}`,
      secondaryHref: site.phoneHref,
    },
    image: {
      src: "/images/adaptation.webp",
      alt: "Adaptation de véhicule PMR par MBT",
    },
    intro: {
      title: "Plus qu’un équipement : un projet de mobilité.",
      paragraphs: [
        "Adapter un véhicule, ce n’est pas seulement installer une rampe. Il faut tenir compte du modèle, du fauteuil, de la fréquence d’usage, du nombre de passagers et des contraintes d’homologation.",
        "Formée auprès de Tripod Mobility (Pays-Bas), l’équipe MBT a internalisé cette expertise en 2016. Aujourd’hui, nous transformons des véhicules classiques en solutions accessibles, fiables et durables.",
        "Particuliers, familles, professionnels du transport ou institutions : chaque projet commence par une écoute précise de votre besoin réel.",
      ],
    },
    useCases: {
      title: "Pour qui adaptons-nous ?",
      intro: "Des situations très différentes, une même exigence de sécurité.",
      items: [
        {
          title: "Usage familial",
          text: "Permettre à un proche en fauteuil de voyager dans le véhicule du foyer, en toute autonomie.",
        },
        {
          title: "Professionnels du transport",
          text: "Équiper une flotte pour proposer des courses PMR ou répondre à un marché public.",
        },
        {
          title: "Institutions et associations",
          text: "Véhicules de service pour accompagner bénéficiaires, résidents ou usagers.",
        },
        {
          title: "Remplacement ou évolution",
          text: "Quand le fauteuil change ou que le véhicule actuel n’est plus adapté : nous étudions la meilleure option.",
        },
      ],
    },
    process: {
      title: "Du premier échange à la livraison",
      intro: "Un accompagnement technique et humain, étape par étape.",
      steps: [
        {
          title: "Analyse du besoin",
          text: "Véhicule, fauteuil, usages, contraintes : nous cadrons le projet avant toute proposition.",
        },
        {
          title: "Proposition technique",
          text: "Rampe, abaissement, aménagement intérieur, ancrages : une solution compatible et chiffrée.",
        },
        {
          title: "Réalisation et mises en conformité",
          text: "Travaux, contrôles et accompagnement dans les démarches d’homologation selon le projet.",
        },
      ],
    },
    advantages: {
      title: "L’atelier MBT",
      items: [
        {
          title: "Expertise internalisée",
          text: "L’adaptation n’est pas sous-traitée au hasard : c’est un métier MBT depuis 2016.",
        },
        {
          title: "Sécurité avant tout",
          text: "Ancrages, accès et stabilité du fauteuil sont au cœur de chaque aménagement.",
        },
        {
          title: "Vision transport + adaptation",
          text: "Nous connaissons aussi le terrain du taxi PMR : les solutions sont pensées pour l’usage réel.",
        },
        {
          title: "Devis transparent",
          text: "Vous savez ce qui est proposé, pourquoi, et pour quel résultat de mobilité.",
        },
      ],
    },
    faq: {
      title: "Questions fréquentes",
      items: [
        {
          q: "Quels types d’adaptations proposez-vous ?",
          a: "Selon le véhicule : abaissement du plancher, rampe d’accès, aménagement intérieur, équipements de sécurisation du fauteuil, et accompagnement administratif lié à l’homologation.",
        },
        {
          q: "Combien de temps prend un projet ?",
          a: "Cela dépend du véhicule et de l’ampleur des travaux. Après analyse, nous vous communiquons un délai réaliste avec le devis.",
        },
        {
          q: "Puis-je aussi louer ou acheter un véhicule déjà adapté ?",
          a: "Consultez notre page Location & vente, ou demandez à la centrale ce qui est disponible au moment de votre projet.",
        },
      ],
    },
    related: {
      title: "Services liés",
      slugs: ["pmr", "location-vente", "entreprises"],
    },
    finalCta: {
      title: "Parlons de votre véhicule.",
      text: "Décrivez le modèle et votre besoin : nous vous proposons une solution adaptée.",
      primaryCta: "Demander un devis d’adaptation",
      primaryHref: "/adaptation-tpmr",
      secondaryCta: "Nous contacter",
      secondaryHref: "/contactus",
    },
  },

  "location-vente": {
    slug: "location-vente",
    meta: {
      title: "Location et vente de véhicules professionnels | MBT",
      description:
        "Louez ou achetez un véhicule issu de la flotte professionnelle MBT : historique d’entretien connu, suivi technique, transparence sur l’état et le kilométrage.",
    },
    hero: {
      eyebrow: "Location et vente",
      title: "Des véhicules professionnels avec un historique connu.",
      text: "Après plus de trente ans de transport de personnes, MBT propose à la location ou à la vente certains véhicules de sa flotte — avec un suivi technique documenté.",
      primaryCta: "Voir les véhicules disponibles",
      primaryHref: "/location-vente",
      secondaryCta: "Contacter le service",
      secondaryHref: "/reservation?service=location-vente",
    },
    image: {
      src: "/images/engagements-pmr.jpg",
      alt: "Véhicules professionnels MBT à la location ou à la vente",
    },
    intro: {
      title: "La transparence avant la transaction.",
      paragraphs: [
        "Acheter ou louer un véhicule professionnel, c’est d’abord savoir d’où il vient. Les véhicules proposés par MBT sortent d’une flotte utilisée au quotidien dans le transport de personnes.",
        "Chaque unité a bénéficié d’un entretien régulier. Lorsque nous mettons un véhicule en vente, nous présentons son état, son kilométrage, ses caractéristiques et son historique de façon claire.",
        "Particuliers exigeants, indépendants ou sociétés de transport : vous gagnez du temps avec un interlocuteur qui connaît le véhicule qu’il propose.",
      ],
    },
    useCases: {
      title: "À qui s’adresse ce service ?",
      intro: "Location courte ou moyenne durée, ou acquisition d’un véhicule suivi.",
      items: [
        {
          title: "Professionnels du transport",
          text: "Renforcer temporairement une flotte ou acquérir un véhicule déjà rôdé au métier.",
        },
        {
          title: "Entreprises",
          text: "Besoin ponctuel d’un véhicule fiable pour un collaborateur, un projet ou une mission.",
        },
        {
          title: "Particuliers",
          text: "Un véhicule d’occasion avec un passé d’entretien professionnel, présenté sans surprise.",
        },
        {
          title: "Projets PMR",
          text: "Dans certains cas, un véhicule peut s’inscrire dans une démarche d’adaptation ultérieure.",
        },
      ],
    },
    process: {
      title: "Comment procéder ?",
      intro: "Simple et direct, comme le reste de nos services.",
      steps: [
        {
          title: "Consultez les disponibilités",
          text: "La page Location & vente présente les véhicules actuellement proposés, avec leurs caractéristiques.",
        },
        {
          title: "Contactez le service",
          text: "Posez vos questions sur l’état, l’historique, la location ou les conditions de vente.",
        },
        {
          title: "Visite et finalisation",
          text: "Nous organisons la découverte du véhicule et finalisons ensemble la formule adaptée.",
        },
      ],
    },
    advantages: {
      title: "Pourquoi passer par MBT ?",
      items: [
        {
          title: "Historique connu",
          text: "Pas de zone d’ombre : le véhicule a vécu dans une flotte suivie et entretenue.",
        },
        {
          title: "Expertise métier",
          text: "Nous savons ce qu’un véhicule de transport doit endurer — et ce qu’il faut vérifier.",
        },
        {
          title: "Lien avec l’adaptation",
          text: "Un projet d’accessibilité peut s’articuler avec l’achat ou la location d’un modèle adapté.",
        },
        {
          title: "Relation de confiance",
          text: "Même exigence de clarté que pour nos courses taxi, VSL ou PMR.",
        },
      ],
    },
    faq: {
      title: "Questions fréquentes",
      items: [
        {
          q: "Les véhicules sont-ils toujours disponibles ?",
          a: "Le stock évolue. Consultez la page Location & vente ou contactez-nous pour connaître l’offre du moment.",
        },
        {
          q: "Puis-je louer avant d’acheter ?",
          a: "Selon le véhicule et la disponibilité, une formule de location peut être envisagée. Demandez conseil au service.",
        },
        {
          q: "Proposez-vous des véhicules déjà adaptés PMR ?",
          a: "Cela dépend du moment. Indiquez votre besoin : nous vous dirons ce qui est possible, y compris via notre service d’adaptation.",
        },
      ],
    },
    related: {
      title: "Services liés",
      slugs: ["adaptation", "entreprises", "pmr"],
    },
    finalCta: {
      title: "Intéressé par un véhicule MBT ?",
      text: "Consultez les fiches disponibles ou écrivez-nous pour préciser votre recherche.",
      primaryCta: "Voir les véhicules",
      primaryHref: "/location-vente",
      secondaryCta: "Contacter le service",
      secondaryHref: "/reservation?service=location-vente",
    },
  },
};

export const serviceNavLabels: Record<ServiceSlug, string> = {
  entreprises: "Taxi pour entreprises",
  quotidien: "Taxi au quotidien",
  vsl: "Transport VSL",
  pmr: "Taxi PMR",
  adaptation: "Adaptation PMR",
  "location-vente": "Location & vente",
};

export function getServicePage(slug: string): ServicePage | undefined {
  if ((serviceSlugs as readonly string[]).includes(slug)) {
    return servicePages[slug as ServiceSlug];
  }
  return undefined;
}
