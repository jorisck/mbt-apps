import { z } from "zod";

const transportService = z.enum(["business", "quotidien", "vsl", "pmr"]);
const messageService = z.enum(["adaptation", "location-vente"]);

export const reservationSchema = z
  .object({
    service: z.enum(["business", "quotidien", "vsl", "pmr", "adaptation", "location-vente"]),
    firstName: z.string().min(1, "Indiquez votre prénom"),
    lastName: z.string().min(1, "Indiquez votre nom"),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
    email: z.string().email("E-mail invalide"),
    notes: z.string().optional(),
    consent: z
      .string({ error: "Le consentement est requis" })
      .refine((v) => v === "on", { message: "Le consentement est requis" }),
    healthConsent: z.string().optional(),
    tripDate: z.string().optional(),
    tripTime: z.string().optional(),
    returnDate: z.string().optional(),
    returnTime: z.string().optional(),
    pickup: z.string().optional(),
    dropoff: z.string().optional(),
    passengerCount: z.coerce.number().int().min(1).max(8).optional(),
    tripType: z.enum(["aller", "aller-retour"]).optional(),
    wheelchair: z.enum(["non", "manuel", "electrique", "preciser"]).optional(),
    wheelchairNotes: z.string().optional(),
    companions: z.coerce.number().int().min(0).max(7).optional(),
    doorToDoor: z.string().optional(),
    staysInWheelchair: z.string().optional(),
    vehicleBrand: z.string().optional(),
    vehicleModel: z.string().optional(),
    vehicleYear: z.string().optional(),
    adaptationType: z.string().optional(),
    wheelchairType: z.string().optional(),
    desiredDate: z.string().optional(),
    searchType: z.enum(["location", "achat"]).optional(),
    vehicleWish: z.string().optional(),
    pmrVehicle: z.enum(["oui", "non"]).optional(),
    budget: z.string().optional(),
    delay: z.string().optional(),
    idempotencyKey: z.string().uuid().optional(),
    elapsedMs: z.coerce.number().int().optional(),
    hp: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (transportService.safeParse(data.service).success) {
      if (!data.tripDate) {
        ctx.addIssue({ code: "custom", message: "Date requise", path: ["tripDate"] });
      }
      if (!data.tripTime) {
        ctx.addIssue({ code: "custom", message: "Heure requise", path: ["tripTime"] });
      }
      if (!data.pickup || data.pickup.length < 3) {
        ctx.addIssue({ code: "custom", message: "Adresse de départ requise", path: ["pickup"] });
      }
      if (!data.dropoff || data.dropoff.length < 3) {
        ctx.addIssue({ code: "custom", message: "Adresse d'arrivée requise", path: ["dropoff"] });
      }
      if (data.tripType === "aller-retour") {
        if (!data.returnDate) {
          ctx.addIssue({ code: "custom", message: "Date de retour requise", path: ["returnDate"] });
        }
        if (!data.returnTime) {
          ctx.addIssue({ code: "custom", message: "Heure de retour requise", path: ["returnTime"] });
        }
      }
      if (data.wheelchair && data.wheelchair !== "non" && data.healthConsent !== "on") {
        ctx.addIssue({
          code: "custom",
          message: "Le consentement santé est requis pour indiquer un besoin de mobilité",
          path: ["healthConsent"],
        });
      }
      if (data.wheelchair === "preciser" && !(data.wheelchairNotes && data.wheelchairNotes.length > 1)) {
        ctx.addIssue({
          code: "custom",
          message: "Précisez l'aide à la mobilité",
          path: ["wheelchairNotes"],
        });
      }
    }
    if (data.service === "adaptation") {
      if (!data.vehicleBrand || data.vehicleBrand.length < 2) {
        ctx.addIssue({ code: "custom", message: "Marque du véhicule requise", path: ["vehicleBrand"] });
      }
      if (!data.vehicleModel || data.vehicleModel.length < 1) {
        ctx.addIssue({ code: "custom", message: "Modèle requis", path: ["vehicleModel"] });
      }
    }
    if (data.service === "location-vente" && !data.searchType) {
      ctx.addIssue({ code: "custom", message: "Indiquez location ou achat", path: ["searchType"] });
    }
  });

export const quoteSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  phone: z.string().optional(),
  email: z.string().email("E-mail invalide"),
  vehicle: z.string().min(2, "Marque et modèle requis"),
  floor: z.boolean().optional(),
  ramp: z.boolean().optional(),
  details: z.string().optional(),
  desiredDate: z.string().optional(),
  consent: z
    .string({ error: "Le consentement est requis" })
    .refine((v) => v === "on", { message: "Le consentement est requis" }),
  elapsedMs: z.coerce.number().int().optional(),
  hp: z.string().optional(),
});

export const contactSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("E-mail invalide"),
  phone: z.string().optional(),
  subject: z.string().min(2, "Objet requis"),
  message: z.string().min(5, "Message trop court"),
  consent: z
    .string({ error: "Le consentement est requis" })
    .refine((v) => v === "on", { message: "Le consentement est requis" }),
  elapsedMs: z.coerce.number().int().optional(),
  hp: z.string().optional(),
});

export type ReservationInput = z.infer<typeof reservationSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

export { messageService, transportService };

