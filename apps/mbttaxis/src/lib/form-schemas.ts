import { z } from "zod";

export const reservationSchema = z.object({
  name: z.string().min(2, "Indiquez votre nom et prénom"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  email: z.string().email("E-mail invalide"),
  tripAt: z.string().min(1, "Choisissez la date et l'heure du trajet"),
  bookingTime: z.string().optional(),
  pickup: z.string().min(3, "Adresse de départ requise"),
  dropoff: z.string().min(3, "Adresse d'arrivée requise"),
  wheelchair: z.enum(["oui", "non"]),
  notes: z.string().optional(),
});

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
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("E-mail invalide"),
  phone: z.string().optional(),
  subject: z.string().min(2, "Objet requis"),
  message: z.string().min(5, "Message trop court"),
});

export type ReservationInput = z.infer<typeof reservationSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
