export const cookies = {
  meta: {
    title: "Cookies et confidentialité | MBT Taxis",
    description:
      "Politique de confidentialité, utilisation des cookies et droits relatifs aux données personnelles chez MBT Taxis.",
  },
  banner: {
    text: "Le respect de votre vie privée est notre priorité.",
    acceptAll: "Autoriser tous les cookies",
    essentialOnly: "N’autoriser que les cookies essentiels",
  },
  page: {
    title: "MBT Taxis respecte votre vie privée.",
    intro: [
      "MBT Taxis accorde une attention particulière à la protection de vos données personnelles. Le traitement de ces données est réalisé dans le respect de la législation applicable, notamment le Règlement général sur la protection des données — Règlement (UE) 2016/679.",
      "Cette politique explique quelles informations peuvent être collectées, pourquoi elles sont utilisées, pendant combien de temps elles sont conservées et comment exercer vos droits.",
    ],
    sections: [
      {
        title: "Responsable du traitement",
        paragraphs: [
          "MBT Taxis est responsable du traitement des données collectées par l’intermédiaire de ce site et de ses formulaires.",
          "Pour toute question relative à vos données personnelles, contactez : pmr@mbt.be.",
        ],
      },
      {
        title: "Données susceptibles d’être collectées",
        intro: "Selon votre utilisation du site, MBT peut traiter :",
        list: [
          "votre nom et votre prénom ;",
          "votre adresse e-mail ;",
          "votre numéro de téléphone ;",
          "les informations nécessaires à l’organisation d’un trajet ;",
          "les informations relatives à un véhicule ou à un projet d’adaptation ;",
          "votre adresse IP et certaines informations techniques de navigation ;",
          "vos préférences en matière de cookies.",
        ],
      },
      {
        title: "Finalités du traitement",
        intro: "Vos données peuvent être utilisées pour :",
        list: [
          "répondre à vos questions ;",
          "traiter une demande de réservation ;",
          "préparer un devis ;",
          "organiser les services sollicités ;",
          "améliorer le site et les services de MBT ;",
          "assurer la sécurité technique du site ;",
          "respecter les obligations légales de l’entreprise.",
        ],
        paragraphs: [
          "MBT ne vend pas vos données personnelles.",
          "Les données peuvent être communiquées aux prestataires nécessaires au fonctionnement du service ou aux autorités lorsqu’une obligation légale l’impose.",
        ],
      },
      {
        title: "Cookies",
        paragraphs: [
          "Le site peut utiliser plusieurs catégories de cookies.",
        ],
        subsections: [
          {
            title: "Cookies strictement nécessaires",
            text: "Ils permettent le fonctionnement technique du site, la sécurité et la mémorisation de certains choix.",
          },
          {
            title: "Cookies de mesure d’audience",
            text: "Ils permettent de comprendre comment le site est utilisé afin d’en améliorer les performances et le contenu.",
          },
          {
            title: "Cookies marketing",
            text: "Ils ne peuvent être utilisés qu’avec le consentement préalable du visiteur lorsqu’il est requis par la législation.",
          },
        ],
        closing:
          "Le visiteur doit pouvoir accepter, refuser ou modifier ses préférences à tout moment.",
      },
      {
        title: "Durée de conservation",
        paragraphs: [
          "Les données sont conservées uniquement pendant la durée nécessaire à la finalité pour laquelle elles ont été collectées ou pendant la durée imposée par une obligation légale.",
        ],
      },
      {
        title: "Sécurité",
        paragraphs: [
          "MBT met en place des mesures techniques et organisationnelles destinées à réduire les risques de perte, d’accès non autorisé, d’altération ou de divulgation de données personnelles.",
          "L’accès aux données est limité aux personnes qui en ont besoin dans le cadre de leur mission et qui sont tenues à une obligation de confidentialité.",
        ],
      },
      {
        title: "Vos droits",
        intro: "Dans les conditions prévues par le RGPD, vous pouvez notamment :",
        list: [
          "demander l’accès à vos données ;",
          "demander leur rectification ;",
          "demander leur suppression ;",
          "retirer votre consentement ;",
          "demander la limitation d’un traitement ;",
          "vous opposer à certains traitements.",
        ],
        paragraphs: [
          "Pour exercer vos droits, écrivez à pmr@mbt.be.",
          "Une preuve d’identité peut être demandée lorsqu’elle est nécessaire pour protéger vos informations.",
        ],
      },
    ],
  },
} as const;
