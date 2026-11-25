export const reservation = {
  meta: {
    title: "Réservation Taxis PMR | mbttaxis",
    description:
      "Besoin d'un taxi PMR à Bruxelles ? Réservez un trajet adapté, confortable et sécurisé avec MBT Taxis.",
  },
  hero: {
    title: "Besoin d'un taxi PMR à Bruxelles ?",
    subtitle:
      "Choisissez MBT Taxis pour un trajet adapté, confortable et sécurisé.",
    primaryCta: "Réservez votre taxi PMR",
    primaryHref: "#formulaire-reservation",
    secondaryCta: "Contactez-nous",
    secondaryHref: "/contactus",
  },
  features: {
    title: "Un service pensé pour vous…",
    intro:
      "Nous mettons tout en œuvre pour vous garantir des déplacements sûrs, confortables et sans stress. Réservez facilement un taxi PMR adapté pour vos déplacements à Bruxelles et dans ses alentours.",
    items: [
      {
        title: "Véhicules adaptés",
        text: "Nos taxis PMR sont spécialement équipés pour accueillir les personnes en fauteuil roulant. L'accès est facilité et le confort est assuré tout au long du trajet.",
      },
      {
        title: "Chauffeurs formés",
        text: "Nos chauffeurs sont formés à l'accompagnement des personnes à mobilité réduite. Ils assurent une prise en charge respectueuse, humaine et attentive à chaque étape du trajet.",
      },
      {
        title: "Ponctualité",
        text: "Nous accordons une grande importance au respect des horaires, notamment pour les rendez-vous médicaux, professionnels ou personnels.",
      },
      {
        title: "Tarifs clairs",
        text: "Nos tarifs sont transparents et conformes à la réglementation en vigueur, sans frais cachés ni mauvaises surprises.",
      },
    ],
  },
  zones: {
    title: "Zones desservies",
    text: "Nous assurons vos déplacements en taxi PMR à Bruxelles et dans ses environs. Que ce soit pour des trajets en ville, des rendez-vous médicaux, des transferts vers les gares, les hôpitaux ou les aéroports, notre service s'adapte à vos besoins et à votre destination. Grâce à notre connaissance du terrain, nous vous garantissons des trajets fluides, ponctuels et en toute sécurité.",
    mapBlocked:
      "Vous devez accepter les cookies facultatifs pour visualiser le contenu interactif.",
  },
  form: {
    id: "formulaire-reservation",
    title: "Réservez un taxi PMR",
    intro:
      "Remplissez le formulaire ci-dessous et nous vous confirmerons la disponibilité dans les plus brefs délais.",
    successTitle: "Votre demande a bien été envoyée.",
    successText:
      "Nous vous contacterons rapidement pour confirmer votre réservation.",
    submit: "Envoyer la demande",
  },
  urgent: {
    title: "Besoin d'une réservation urgente ?",
    text: "Si vous avez besoin d'un taxi PMR rapidement, n'hésitez pas à nous contacter directement par téléphone. Nous sommes disponibles pour vous aider et organiser votre déplacement dans les meilleurs délais.",
    phoneLabel: "Téléphone",
    phone: "+32 2 426 45 53",
    officeLabel: "Bureau",
    address: "Rue des Béguines 160, 1080 Molenbeek-Saint-Jean",
  },
} as const;
