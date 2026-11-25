import { site } from "./site";
import { serviceNavLabels, type ServiceSlug } from "./service-pages";

export const services = {
  meta: {
    title: "Services — Taxi, VSL, PMR, adaptation et véhicules | MBT",
    description:
      "Découvrez les services MBT : taxi pour entreprises, taxi au quotidien, VSL, taxi PMR, adaptation, location et vente de véhicules.",
  },
  hero: {
    eyebrow: "Tous les services",
    title: "Une solution de mobilité pour chaque situation.",
    text: "Particulier, entreprise, patient, personne à mobilité réduite ou professionnel du transport : trouvez le service adapté et passez directement à l’action.",
    primaryCta: "Choisir mon service",
    primaryHref: "#liste-services",
    secondaryCta: "Appeler la centrale",
    secondaryHref: site.phoneHref,
  },
  items: [
    {
      id: "entreprises" as ServiceSlug,
      title: "Des déplacements professionnels mieux organisés.",
      eyebrow: serviceNavLabels.entreprises,
      text: "Réunions, gares, aéroports, événements et trajets récurrents : MBT organise les déplacements de vos collaborateurs et visiteurs en Belgique.",
      image: "/images/audience-pmr.jpg",
      href: "/services/entreprises",
      cta: "Découvrir le service",
    },
    {
      id: "quotidien" as ServiceSlug,
      title: "Votre taxi pour tous les jours.",
      eyebrow: serviceNavLabels.quotidien,
      text: "Rendez-vous, courses, sorties, gares et aéroports : un taxi fiable, planifié avec une centrale humaine à Bruxelles.",
      image: "/images/engagements-pmr.jpg",
      href: "/services/quotidien",
      cta: "Découvrir le service",
    },
    {
      id: "vsl" as ServiceSlug,
      title: "Un transport médico-sanitaire sûr et rassurant.",
      eyebrow: serviceNavLabels.vsl,
      text: "Transport assis non urgent vers hôpitaux, consultations et centres de soins — agrément COCOF n° 30.01.16.",
      image: "/images/vsl.webp",
      href: "/services/vsl",
      cta: "Découvrir le service",
    },
    {
      id: "pmr" as ServiceSlug,
      title: "Un taxi adapté, confortable et accessible.",
      eyebrow: serviceNavLabels.pmr,
      text: "Véhicules équipés fauteuil roulant, chauffeurs formés, réservation MBT ou Handycab.",
      image: "/images/pmr.jpeg",
      href: "/services/pmr",
      cta: "Découvrir le service",
    },
    {
      id: "adaptation" as ServiceSlug,
      title: "Rendez votre véhicule accessible.",
      eyebrow: serviceNavLabels.adaptation,
      text: "Transformation de véhicules pour le transport en fauteuil : rampe, plancher, sécurisation et accompagnement technique.",
      image: "/images/adaptation.webp",
      href: "/services/adaptation",
      cta: "Découvrir le service",
    },
    {
      id: "location-vente" as ServiceSlug,
      title: "Des véhicules professionnels avec un historique connu.",
      eyebrow: serviceNavLabels["location-vente"],
      text: "Location ou vente de véhicules issus de la flotte MBT, avec suivi technique et transparence sur l’état.",
      image: "/images/engagements-pmr.jpg",
      href: "/services/location-vente",
      cta: "Découvrir le service",
    },
  ],
  guide: {
    title: "Quel service choisir ?",
    rows: [
      {
        need: "Déplacement professionnel",
        service: serviceNavLabels.entreprises,
        cta: "Voir la page",
        href: "/services/entreprises",
      },
      {
        need: "Course personnelle",
        service: serviceNavLabels.quotidien,
        cta: "Voir la page",
        href: "/services/quotidien",
      },
      {
        need: "Rendez-vous médical non urgent",
        service: serviceNavLabels.vsl,
        cta: "Voir la page",
        href: "/services/vsl",
      },
      {
        need: "Trajet en fauteuil roulant",
        service: "Taxi PMR ou Handycab",
        cta: "Voir la page",
        href: "/services/pmr",
      },
      {
        need: "Rendre un véhicule accessible",
        service: serviceNavLabels.adaptation,
        cta: "Voir la page",
        href: "/services/adaptation",
      },
      {
        need: "Louer ou acheter un véhicule professionnel",
        service: serviceNavLabels["location-vente"],
        cta: "Voir la page",
        href: "/services/location-vente",
      },
    ],
  },
  finalCta: {
    title: "Vous hésitez encore ? Appelez notre centrale et expliquez simplement votre besoin.",
    cta: `Appeler le ${site.phoneShort}`,
    href: site.phoneHref,
  },
} as const;
