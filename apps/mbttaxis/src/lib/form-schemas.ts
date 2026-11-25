import { z } from "zod";

const serviceEnum = z.enum([
  "business",
  "quotidien",
  "vsl",
  "pmr",
  "adaptation",
  "location-vente",
]);

export const reservationSchema = z
  .object({
    service: serviceEnum,
    name: z.string().min(2, "Indiquez votre nom et prénom"),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
    email: z.string().email("E-mail invalide"),
    notes: z.string().optional(),
    consent: z
      .string({ error: "Le consentement est requis" })
      .refine((v) => v === "on", { message: "Le consentement est requis" }),
    // Transport
    tripDate: z.string().optional(),
    tripTime: z.string().optional(),
    pickup: z.string().optional(),
    dropoff: z.string().optional(),
    passengers: z.string().optional(),
    tripType: z.enum(["aller", "aller-retour"]).optional(),
    wheelchair: z.enum(["non", "manuel", "electrique", "preciser"]).optional(),
    companion: z.enum(["oui", "non"]).optional(),
    // Adaptation
    vehicleBrand: z.string().optional(),
    vehicleModel: z.string().optional(),
    vehicleYear: z.string().optional(),
    adaptationType: z.string().optional(),
    wheelchairType: z.string().optional(),
    desiredDate: z.string().optional(),
    // Location / vente
    searchType: z.enum(["location", "achat"]).optional(),
    vehicleWish: z.string().optional(),
    pmrVehicle: z.enum(["oui", "non"]).optional(),
    budget: z.string().optional(),
    delay: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const transport = ["business", "quotidien", "vsl", "pmr"];
    if (transport.includes(data.service)) {
      if (!data.tripDate) {
        ctx.addIssue({ code: "custom", message: "Date requise", path: ["tripDate"] });
      }
      if (!data.tripTime) {
        ctx.addIssue({ code: "custom", message: "Heure requise", path: ["tripTime"] });
      }
      if (!data.pickup || data.pickup.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: "Adresse de départ requise",
          path: ["pickup"],
        });
      }
      if (!data.dropoff || data.dropoff.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: "Adresse d'arrivée requise",
          path: ["dropoff"],
        });
      }
    }
    if (data.service === "adaptation") {
      if (!data.vehicleBrand || data.vehicleBrand.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Marque du véhicule requise",
          path: ["vehicleBrand"],
        });
      }
      if (!data.vehicleModel || data.vehicleModel.length < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Modèle requis",
          path: ["vehicleModel"],
        });
      }
    }
    if (data.service === "location-vente") {
      if (!data.searchType) {
        ctx.addIssue({
          code: "custom",
          message: "Indiquez location ou achat",
          path: ["searchType"],
        });
      }
    }
  });

/** Conservé pour le formulaire devis sur /adaptation-tpmr */
export const quoteSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  phone: z.string().optional(),
  email: z.string().email("E-mail invalide"),
  vehicle: z.string().min(2, "Marque et modèle requis"),
  floor: z.boolean().optional(),
  ramp: z.boolean().optional(),
  details: z.string().optional(),
  desiredDate: z.string().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Nom et prénom requis"),
  email: z.string().email("E-mail invalide"),
  phone: z.string().optional(),
  subject: z.string().min(2, "Objet requis"),
  message: z.string().min(5, "Message trop court"),
  consent: z
    .string({ error: "Le consentement est requis" })
    .refine((v) => v === "on", { message: "Le consentement est requis" }),
});

export type ReservationInput = z.infer<typeof reservationSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
