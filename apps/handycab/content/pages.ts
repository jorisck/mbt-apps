import { site } from "./site";

export const howItWorks = {
  seo: {
    title: "Comment réserver un taxi PMR avec Handycab ?",
    description:
      "Découvrez comment commander immédiatement ou planifier un taxi adapté à Bruxelles avec Handycab.",
  },
  hero: {
    eyebrow: "Mode d’emploi",
    title: "Réserver un taxi adapté, simplement.",
    body: "Depuis la plateforme, l’application ou par téléphone, choisissez la méthode qui vous convient et préparez votre trajet en quelques étapes.",
  },
  web: {
    title: "Sans installation, depuis n’importe quel appareil.",
    steps: [
      "Ouvrez la plateforme Handycab.",
      "Identifiez-vous ou renseignez les informations demandées.",
      "Indiquez l’adresse de départ.",
      "Ajoutez la destination.",
      "Choisissez une commande immédiate ou une réservation planifiée.",
      "Vérifiez les informations et confirmez votre commande.",
    ],
    cta: "Ouvrir la plateforme Handycab",
  },
  app: {
    title: "Retrouvez Handycab sur votre smartphone.",
    body: "L’application vous permet de retrouver le service Handycab directement sur votre téléphone pour vos prochains déplacements.",
  },
  phone: {
    title: "Une assistance humaine lorsque vous en avez besoin.",
    body: `Si vous rencontrez une difficulté avec la plateforme ou si vous préférez expliquer votre situation de vive voix, appelez le ${site.phoneDisplay}.`,
    prepare: [
      "votre adresse de départ",
      "votre destination",
      "la date et l’heure souhaitées",
      "le nombre de passagers",
      "le type de fauteuil",
      "la présence éventuelle d’un accompagnant",
      "un numéro où vous joindre",
    ],
    cta: "Appeler le service Handycab",
  },
  timing: {
    immediate: {
      title: "Commande immédiate",
      body: "Vous avez besoin d’un taxi dès que possible. La demande est envoyée afin de rechercher un véhicule adapté disponible. La disponibilité et le délai d’arrivée dépendent de la situation des véhicules au moment de la commande.",
    },
    planned: {
      title: "Course planifiée",
      body: "Vous connaissez déjà la date et l’heure de votre déplacement. Programmez votre course à l’avance afin de transmettre votre demande pour ce moment précis.",
    },
    note: "Une réservation ou une demande de course reste soumise à la disponibilité d’un taxi adapté et à sa confirmation dans l’interface ou par le service.",
  },
  before: {
    title: "Avant l’arrivée du taxi",
    items: [
      "Vérifiez que le téléphone associé à la réservation reste joignable.",
      "Préparez les informations utiles concernant l’accès au lieu de départ.",
      "Prévoyez le temps nécessaire pour rejoindre le véhicule.",
      "Signalez tout besoin particulier lors de la réservation.",
    ],
    cta: "Préparer mon prochain trajet",
  },
  faq: {
    title: "FAQ — Comment ça marche",
    intro: "Tout ce qu’il faut savoir pour préparer et confirmer votre course.",
    items: [
      {
        q: "Faut-il créer un compte pour réserver ?",
        a: "Selon le parcours, la plateforme peut vous demander de vous identifier ou de renseigner les informations nécessaires. En cas de doute, utilisez l’assistance téléphonique.",
      },
      {
        q: "Quelle est la différence entre commande immédiate et course planifiée ?",
        a: "La commande immédiate recherche un véhicule disponible dès que possible. La course planifiée envoie votre demande pour une date et une heure précises.",
      },
      {
        q: "Ma réservation est-elle garantie dès l’envoi ?",
        a: "Non. Une demande reste soumise à la disponibilité d’un taxi adapté et à sa confirmation dans l’interface ou par le service.",
      },
      {
        q: "Que préparer avant d’appeler ?",
        a: "Adresse de départ, destination, date et heure, nombre de passagers, type de fauteuil, présence d’un accompagnant et un numéro où vous joindre.",
      },
      {
        q: "Que faire juste avant l’arrivée du taxi ?",
        a: "Restez joignable, préparez l’accès au lieu de départ, prévoyez le temps pour rejoindre le véhicule et signalez tout besoin particulier lors de la réservation.",
      },
    ],
  },
} as const;

export const service = {
  seo: {
    title: "Taxis adaptés, chauffeurs PMR et paiements | Handycab",
    description:
      "Découvrez les taxis adaptés Handycab, la formation des chauffeurs, les moyens de paiement et les engagements du service.",
  },
  hero: {
    eyebrow: "Un service pensé pour la mobilité PMR",
    title: "Adapté ne doit jamais signifier compliqué.",
    body: "Des véhicules autorisés, des chauffeurs formés et plusieurs moyens de paiement pour rendre chaque trajet aussi simple et serein que possible.",
  },
  vehicles: {
    title: "Des taxis conçus pour accueillir les personnes à mobilité réduite.",
    body: "Les taxis proposés par Handycab sont adaptés et entretenus par une entreprise bruxelloise agréée. Ils disposent d’une autorisation taxi officielle délivrée par la Région de Bruxelles-Capitale. Selon le véhicule et le besoin, l’aménagement facilite l’accès et le transport d’une personne en fauteuil roulant.",
    infos: [
      "fauteuil manuel ou électrique",
      "dimensions ou poids particuliers du fauteuil, si nécessaire",
      "nombre de passagers et d’accompagnants",
      "bagages ou matériel supplémentaire",
      "difficulté d’accès au point de départ ou à la destination",
    ],
    cta: "Réserver le véhicule adapté",
  },
  drivers: {
    title: "Une formation orientée conduite et sécurité PMR.",
    body: "Les chauffeurs affiliés au service Handycab ont suivi une formation orientée vers la conduite et la sécurité des personnes à mobilité réduite. Ils assurent le trajet jusqu’à l’adresse de destination dans le respect du passager, de son fauteuil et des règles de sécurité applicables.",
    commitments: [
      "accueil respectueux",
      "attention portée aux besoins communiqués",
      "conduite adaptée",
      "sécurisation correcte du fauteuil lorsque le véhicule le nécessite",
      "respect de la destination renseignée dans la commande",
    ],
  },
  pricing: {
    title: "Un taxi adapté au tarif d’un taxi ordinaire.",
    body: "Selon les informations publiées par handicap.brussels, les usagers qui utilisent un taxi adapté paient le même tarif à la course qu’un usager d’un taxi ordinaire. Les tarifs applicables sont ceux du taxi bruxellois et doivent être affichés ou calculés conformément à la réglementation en vigueur.",
    note: "Les suppléments, conditions d’attente, annulations et modalités particulières doivent être vérifiés dans les conditions générales de réservation en vigueur.",
    cta: "Consulter les conditions générales",
  },
  payment: {
    title: "Choisissez votre moyen de paiement.",
    methods: ["Espèces", "Bancontact", "Mastercard", "Visa"],
    note: "Les véhicules sont annoncés comme étant équipés d’un terminal de paiement.",
    closing: "Un véhicule adapté vous attend pour votre prochain trajet.",
    cta: "Réserver maintenant",
  },
  faq: {
    title: "FAQ — Le service",
    intro: "Véhicules, chauffeurs, tarifs et paiements : les réponses utiles.",
    items: [
      {
        q: "Les véhicules sont-ils officiellement autorisés ?",
        a: "Les taxis proposés sont adaptés et entretenus par une entreprise bruxelloise agréée, avec une autorisation taxi officielle délivrée par la Région de Bruxelles-Capitale.",
      },
      {
        q: "Quelles informations donner sur mon fauteuil ?",
        a: "Précisez s’il est manuel ou électrique, toute dimension ou poids particulier, le nombre de passagers, les bagages et d’éventuelles difficultés d’accès.",
      },
      {
        q: "Les chauffeurs sont-ils formés au transport PMR ?",
        a: "Oui. Les chauffeurs affiliés ont suivi une formation orientée conduite, accueil et sécurité des personnes à mobilité réduite.",
      },
      {
        q: "Le tarif est-il le même qu’un taxi classique ?",
        a: "Selon handicap.brussels, les usagers d’un taxi adapté paient le même tarif à la course qu’un usager d’un taxi ordinaire.",
      },
      {
        q: "Comment payer ma course ?",
        a: "Espèces, Bancontact, Mastercard ou Visa. Les véhicules sont équipés d’un terminal de paiement.",
      },
    ],
  },
} as const;

export const application = {
  seo: {
    title: "Application Handycab — Taxi PMR sur Android et iPhone",
    description:
      "Téléchargez l’application Handycab et commandez ou planifiez un taxi PMR depuis votre smartphone.",
  },
  hero: {
    eyebrow: "Handycab mobile",
    title: "Votre taxi PMR, directement sur votre téléphone.",
    body: "Téléchargez gratuitement l’application Handycab pour commander immédiatement ou planifier votre prochain trajet adapté.",
  },
  features: [
    {
      icon: "clock" as const,
      title: "Commander immédiatement",
      body: "Envoyez une demande lorsqu’un déplacement doit être organisé dès que possible.",
    },
    {
      icon: "calendar" as const,
      title: "Planifier un trajet",
      body: "Choisissez une date et une heure lorsque votre déplacement est connu à l’avance.",
    },
    {
      icon: "pin" as const,
      title: "Indiquer les adresses",
      body: "Renseignez clairement le lieu de prise en charge et la destination.",
    },
    {
      icon: "check" as const,
      title: "Choisir son moyen de paiement",
      body: "Utilisez l’un des moyens de paiement annoncés par le service.",
    },
    {
      icon: "user" as const,
      title: "Gérer son profil",
      body: "Retrouvez les informations nécessaires à l’utilisation du service depuis votre compte.",
    },
  ],
  note: "Les fonctionnalités exactes de suivi du chauffeur, d’historique, d’estimation ou de notifications doivent être confirmées dans la version actuelle de l’application.",
  webAlt: {
    title: "Vous ne souhaitez pas installer l’application ?",
    body: "Utilisez directement la version web depuis votre navigateur.",
    cta: "Réserver sur le web",
  },
  help: {
    title: "Besoin d’aide avec l’application ?",
    body: `Appelez le ${site.phoneDisplay} ou utilisez la page d’aide.`,
    cta: "Obtenir de l’aide",
  },
  faq: {
    title: "FAQ — L’application",
    intro: "Téléchargement, fonctionnalités et alternatives si vous préférez le web.",
    items: [
      {
        q: "Sur quels appareils l’app est-elle disponible ?",
        a: "Handycab est disponible gratuitement sur Android (Google Play) ainsi que sur iPhone et iPad (App Store).",
      },
      {
        q: "Puis-je commander une course immédiate depuis l’app ?",
        a: "Oui. Vous pouvez envoyer une demande dès que possible, sous réserve de disponibilité d’un véhicule adapté.",
      },
      {
        q: "Puis-je planifier un trajet dans l’application ?",
        a: "Oui. Choisissez une date et une heure lorsque votre déplacement est connu à l’avance.",
      },
      {
        q: "Dois-je absolument installer l’application ?",
        a: "Non. Vous pouvez aussi réserver directement sur la version web depuis votre navigateur.",
      },
      {
        q: "Que faire si l’application ne fonctionne pas ?",
        a: `Appelez le ${site.phoneDisplay} ou consultez la page d’aide pour être accompagné.`,
      },
    ],
  },
} as const;

export const organisations = {
  seo: {
    title: "Taxis PMR pour organisations et établissements | Handycab",
    description:
      "Organisez des trajets PMR avec Handycab pour vos patients, résidents, bénéficiaires, collaborateurs ou visiteurs.",
  },
  hero: {
    eyebrow: "Pour les professionnels",
    title: "Organisez plus facilement les trajets PMR de vos bénéficiaires.",
    body: "Hôpital, maison de repos, association, entreprise ou institution : échangeons sur vos besoins réguliers de mobilité adaptée.",
  },
  audiences: [
    "hôpitaux et centres médicaux",
    "maisons de repos et résidences-services",
    "associations",
    "services d’accompagnement",
    "mutuelles",
    "communes et organismes publics",
    "entreprises",
    "organisateurs d’événements accessibles",
  ],
  needs: [
    {
      title: "Organiser un trajet individuel",
      body: "Réserver un taxi adapté pour un patient, un résident, un bénéficiaire, un collaborateur ou un visiteur.",
    },
    {
      title: "Planifier des déplacements",
      body: "Préparer à l’avance des trajets connus et communiquer les besoins particuliers du passager.",
    },
    {
      title: "Centraliser les demandes",
      body: "Étudier la possibilité de regrouper les demandes d’une organisation autour d’un fonctionnement commun.",
    },
    {
      title: "Modalités de facturation",
      body: "Les conditions générales de Handycab mentionnent l’existence possible de clients abonnés disposant de modalités commerciales et de facturation particulières. Toute offre professionnelle doit être confirmée avec l’équipe Handycab.",
    },
  ],
  form: {
    title: "Demande d’information professionnelle",
    fields: [
      "Nom de l’organisation",
      "Secteur d’activité",
      "Personne de contact",
      "Téléphone",
      "E-mail professionnel",
      "Nombre approximatif de trajets",
      "Fréquence des besoins",
      "Zones ou destinations habituelles",
      "Nombre de passagers concernés",
      "Types de fauteuils ou besoins particuliers",
      "Besoin de facturation centralisée",
      "Message",
    ],
    cta: "Être recontacté par Handycab",
  },
  cta: {
    title: "Construisons une solution adaptée à votre organisation.",
    primary: "Contacter l’équipe",
    secondary: `Appeler le ${site.phone}`,
  },
  faq: {
    title: "FAQ — Organisations",
    intro: "Pour hôpitaux, maisons de repos, associations et entreprises.",
    items: [
      {
        q: "Pour qui s’adresse l’offre organisations ?",
        a: "Hôpitaux, centres médicaux, maisons de repos, associations, services d’accompagnement, mutuelles, organismes publics, entreprises et organisateurs d’événements accessibles.",
      },
      {
        q: "Puis-je réserver pour un patient ou un résident ?",
        a: "Oui. Vous pouvez organiser un trajet individuel pour un patient, un résident, un bénéficiaire, un collaborateur ou un visiteur.",
      },
      {
        q: "Peut-on centraliser les demandes d’une structure ?",
        a: "Il est possible d’étudier un fonctionnement commun pour regrouper les demandes. Contactez l’équipe Handycab pour en discuter.",
      },
      {
        q: "La facturation centralisée est-elle disponible ?",
        a: "Les conditions générales mentionnent des modalités possibles pour clients abonnés. Toute offre professionnelle doit être confirmée avec l’équipe avant d’être considérée comme un service standard.",
      },
      {
        q: "Comment démarrer avec Handycab pour mon établissement ?",
        a: "Remplissez le formulaire professionnel ou appelez le service pour exposer vos besoins, fréquences et zones habituelles.",
      },
    ],
  },
} as const;

export const about = {
  seo: {
    title: "À propos de Handycab — La mobilité PMR à Bruxelles",
    description:
      "Découvrez la mission de Handycab : simplifier la réservation de taxis adaptés et rendre la mobilité plus accessible à Bruxelles.",
  },
  hero: {
    eyebrow: "Notre mission",
    title: "Faire de la mobilité un droit réellement accessible.",
    body: "Handycab rapproche les personnes à mobilité réduite des taxis adaptés disponibles à Bruxelles grâce à une plateforme web, une application mobile et une assistance téléphonique.",
  },
  why: {
    title: "Pourquoi Handycab ?",
    paragraphs: [
      "Trouver un taxi accessible peut demander davantage de préparation qu’une course classique : disponibilité du véhicule, dimensions du fauteuil, organisation de la prise en charge et besoin d’accompagnement.",
      "Handycab a été développé pour simplifier cette recherche et centraliser l’offre de taxis adaptés à Bruxelles.",
      "L’objectif est de permettre à chaque passager de se déplacer avec davantage d’autonomie, de confiance et de liberté.",
    ],
  },
  brussels: {
    title: "Une initiative bruxelloise",
    body: "Handycab a été développé dans l’écosystème de MBT, entreprise bruxelloise active dans le transport de personnes et la mobilité PMR. Le service met en relation les utilisateurs avec des chauffeurs affiliés disposant des autorisations requises pour exercer l’activité de taxi en Région de Bruxelles-Capitale.",
    legal:
      "Les conditions générales précisent que le service Handycab agit comme une interface de mise en relation entre l’usager et le chauffeur qui réalise la course.",
  },
  award: {
    title: "Une innovation reconnue",
    body: "La création de Handycab a été récompensée par le Prix CAP48 de l’entreprise citoyenne dans la catégorie Innovation. Cette reconnaissance souligne l’ambition du projet : utiliser la technologie pour faciliter concrètement la mobilité des personnes à mobilité réduite.",
  },
  cta: {
    title: "La prochaine destination commence ici.",
    primary: "Réserver avec Handycab",
    secondary: "Télécharger l’application",
  },
  faq: {
    title: "FAQ — À propos",
    intro: "Mission, rôle de la plateforme et reconnaissance du projet.",
    items: [
      {
        q: "Pourquoi Handycab a-t-il été créé ?",
        a: "Pour simplifier la recherche et la réservation d’un taxi adapté à Bruxelles, et donner plus d’autonomie aux personnes à mobilité réduite.",
      },
      {
        q: "Handycab est-il un transporteur ?",
        a: "Selon les conditions générales, Handycab agit comme une interface de mise en relation entre l’usager et le chauffeur qui réalise la course.",
      },
      {
        q: "Quel est le lien avec MBT ?",
        a: "Handycab a été développé dans l’écosystème de MBT, entreprise bruxelloise active dans le transport de personnes et la mobilité PMR.",
      },
      {
        q: "Le service est-il limité à Bruxelles ?",
        a: "Le service met en relation les utilisateurs avec des chauffeurs disposant des autorisations requises en Région de Bruxelles-Capitale.",
      },
      {
        q: "Handycab a-t-il reçu une reconnaissance ?",
        a: "Oui. La création de Handycab a été récompensée par le Prix CAP48 de l’entreprise citoyenne dans la catégorie Innovation.",
      },
    ],
  },
} as const;

export const help = {
  seo: {
    title: "Aide et contact | Handycab",
    description:
      "Besoin d’aide pour réserver ou utiliser l’application Handycab ? Retrouvez le téléphone, les réponses pratiques et le formulaire de contact.",
  },
  hero: {
    eyebrow: "Nous sommes là pour vous aider",
    title: "Une question avant votre trajet ?",
    body: "Retrouvez les réponses aux questions fréquentes ou contactez l’équipe Handycab pour être accompagné dans votre réservation.",
  },
  contact: {
    phone: site.phoneDisplay,
    email: site.email,
    address: `${site.address.street}, ${site.address.postalCode} ${site.address.city}`,
  },
  faq: [
    {
      q: "Quels types de fauteuils peuvent être transportés ?",
      a: "Les véhicules sont adaptés au transport PMR, mais leurs configurations peuvent varier. Indiquez toujours si le fauteuil est manuel ou électrique et communiquez toute dimension ou caractéristique particulière lors de la réservation.",
    },
    {
      q: "Puis-je voyager avec un accompagnant ?",
      a: "Indiquez le nombre total de passagers lors de la réservation afin que le service puisse rechercher un véhicule approprié.",
    },
    {
      q: "Puis-je commander un taxi immédiatement ?",
      a: "Oui, l’application permet les commandes immédiates. La prise en charge reste toutefois soumise à la disponibilité d’un véhicule adapté au moment de la demande.",
    },
    {
      q: "Puis-je réserver pour plus tard ?",
      a: "Oui, Handycab permet également de planifier une course pour une date et une heure déterminées.",
    },
    {
      q: "Comment puis-je payer ?",
      a: "Les moyens annoncés sont les espèces, Bancontact, Mastercard et Visa. Les véhicules sont équipés d’un terminal de paiement.",
    },
    {
      q: "Le taxi adapté coûte-t-il plus cher ?",
      a: "Selon handicap.brussels, une personne utilisant un taxi adapté paie le même tarif à la course qu’un utilisateur d’un taxi ordinaire.",
    },
    {
      q: "Que faire si je ne parviens pas à utiliser l’application ?",
      a: `Appelez le ${site.phoneDisplay} afin de demander de l’aide.`,
    },
    {
      q: "Comment signaler un objet perdu ou un problème après la course ?",
      a: "Utilisez le numéro ou l’adresse de support en communiquant la date, l’heure, le trajet et toute référence disponible.",
    },
  ],
  form: {
    subjects: [
      "Aide à la réservation",
      "Problème avec l’application",
      "Question sur un véhicule adapté",
      "Objet perdu",
      "Réclamation",
      "Demande professionnelle",
      "Autre",
    ],
    cta: "Envoyer ma demande",
  },
} as const;

export const privacy = {
  seo: {
    title: "Cookies et confidentialité | Handycab",
    description:
      "Découvrez comment Handycab traite les données utilisées pour la réservation, l’application et le fonctionnement du service.",
  },
  title: "Votre mobilité implique des données personnelles. Elles doivent être protégées.",
  intro:
    "L’utilisation de Handycab peut nécessiter le traitement d’informations personnelles, d’adresses, de données de localisation et d’informations relatives à une course.",
  data: [
    "nom et prénom",
    "numéro de téléphone",
    "adresse e-mail",
    "adresse de départ et destination",
    "données de localisation nécessaires au service",
    "date et heure de la course",
    "préférences et informations liées au compte",
    "informations de paiement traitées par les prestataires concernés",
    "contenu transmis au support",
    "données techniques et de diagnostic de l’application",
    "informations liées aux cookies et à la navigation",
  ],
  purposes: [
    "créer et gérer un compte",
    "rechercher un chauffeur disponible",
    "organiser et exécuter une commande",
    "permettre le contact entre le passager, la centrale et le chauffeur",
    "traiter ou faciliter un paiement",
    "assurer l’assistance et le suivi d’une demande",
    "prévenir les abus et sécuriser le service",
    "respecter les obligations légales",
    "améliorer la plateforme et l’application",
  ],
  sensitive:
    "Les informations concernant un fauteuil, un besoin d’assistance ou une situation de mobilité peuvent révéler des données sensibles. Une validation juridique spécifique est recommandée avant toute précision complémentaire.",
  cookies:
    "Le site permet d’accepter, de refuser ou de modifier les préférences de cookies non essentiels. Les cookies strictement nécessaires au fonctionnement peuvent être utilisés sans consentement lorsqu’ils répondent aux conditions légales applicables.",
  rights: [
    "l’accès à ses données",
    "leur rectification",
    "leur suppression",
    "la limitation d’un traitement",
    "la portabilité lorsque celle-ci est applicable",
    "le retrait de son consentement",
    "l’opposition à certains traitements",
  ],
  faq: {
    title: "FAQ — Confidentialité",
    intro: "Quelques réponses sur le traitement des données Handycab.",
    items: [
      {
        q: "Quelles données peuvent être collectées ?",
        a: "Identité, téléphone, e-mail, adresses de trajet, localisation nécessaire au service, horaires de course, préférences de compte, données de paiement via prestataires, messages au support et données techniques.",
      },
      {
        q: "Pourquoi Handycab traite-t-il ces données ?",
        a: "Pour gérer un compte, rechercher un chauffeur, exécuter une commande, faciliter le paiement, assurer l’assistance, sécuriser le service et respecter les obligations légales.",
      },
      {
        q: "Puis-je refuser les cookies non essentiels ?",
        a: "Oui. Le site doit permettre d’accepter, de refuser ou de modifier les préférences de cookies non essentiels.",
      },
      {
        q: "Comment exercer mes droits RGPD ?",
        a: `Vous pouvez demander l’accès, la rectification, la suppression ou la limitation de vos données. Contactez ${site.email}.`,
      },
    ],
  },
} as const;
