"use server";

import { headers } from "next/headers";
import { api } from "@mbt/api-client/server";
import { z } from "zod";

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const demandeSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  phone: z.string().min(6, "Numéro de téléphone requis"),
  email: z.string().email("Adresse e-mail invalide"),
  tripDate: z.string().min(1, "Date requise"),
  tripTime: z.string().min(1, "Heure requise"),
  pickup: z.string().min(1, "Adresse de départ requise"),
  dropoff: z.string().min(1, "Destination requise"),
  returnDate: z.string().optional(),
  returnTime: z.string().optional(),
  mobilityAid: z
    .enum(["none", "walking_aid", "manual_wheelchair", "electric_wheelchair", "other"])
    .default("none"),
  staysInWheelchair: z.boolean().default(false),
  companions: z.coerce.number().int().min(0).max(5).default(0),
  doorToDoor: z.boolean().default(false),
  notes: z.string().optional(),
  privacyConsent: z.literal("on", {
    error: "Vous devez accepter la politique de confidentialité",
  }),
  healthConsent: z.boolean().default(false),
  idempotencyKey: z.string().uuid().optional(),
  elapsedMs: z.coerce.number().int().min(0).default(0),
  hp: z.string().default(""),
});

type Problem = {
  detail?: string;
  errors?: Record<string, string>;
};

function problemToFormState(error: unknown): FormState {
  const p = (error ?? {}) as Problem;
  const errors: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(p.errors ?? {})) {
    errors[key] = [value];
  }
  return {
    ok: false,
    message: p.detail || "L'envoi a échoué. Vérifiez les champs et réessayez.",
    errors: Object.keys(errors).length ? errors : undefined,
  };
}

async function endUserIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    ""
  );
}

export async function submitDemande(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Honeypot: if filled, silently reject
  const hp = (formData.get("hp") as string) ?? "";
  if (hp) return { ok: false, message: "Spam détecté." };

  const parsed = demandeSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    tripDate: formData.get("tripDate"),
    tripTime: formData.get("tripTime"),
    pickup: formData.get("pickup"),
    dropoff: formData.get("dropoff"),
    returnDate: formData.get("returnDate") || undefined,
    returnTime: formData.get("returnTime") || undefined,
    mobilityAid: formData.get("mobilityAid") || "none",
    staysInWheelchair: formData.get("staysInWheelchair") === "on",
    companions: formData.get("companions") || 0,
    doorToDoor: formData.get("doorToDoor") === "on",
    notes: formData.get("notes") || undefined,
    privacyConsent: formData.get("privacyConsent"),
    healthConsent: formData.get("healthConsent") === "on",
    idempotencyKey: formData.get("idempotencyKey") || undefined,
    elapsedMs: formData.get("elapsedMs") || 0,
    hp,
  });

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  const hasNeeds =
    d.mobilityAid !== "none" || d.companions > 0 || d.doorToDoor;

  const body = {
    service: "pmr" as const,
    pickup_at: `${d.tripDate}T${d.tripTime}`,
    pickup: { formatted: d.pickup },
    dropoff: { formatted: d.dropoff },
    return_at:
      d.returnDate && d.returnTime
        ? `${d.returnDate}T${d.returnTime}`
        : null,
    return_pickup: null,
    passenger_count: 1,
    passenger: {
      first_name: d.firstName,
      last_name: d.lastName,
      phone: d.phone,
      email: d.email,
      language: "fr" as const,
    },
    needs: hasNeeds
      ? {
          mobility_aid: d.mobilityAid,
          stays_in_wheelchair: d.staysInWheelchair,
          companions: d.companions,
          door_to_door: d.doorToDoor,
          notes: d.notes || null,
        }
      : null,
    health_consent: hasNeeds,
    privacy_consent: true,
    comment: d.notes || null,
    antispam: { hp: d.hp, elapsed_ms: d.elapsedMs },
  };

  const ip = await endUserIp();
  const { error } = await api.POST("/v1/demandes", {
    params: {
      header: {
        "Idempotency-Key": d.idempotencyKey ?? crypto.randomUUID(),
        "X-End-User-IP": ip,
      },
    },
    body: body as never,
  });

  if (error) return problemToFormState(error);
  return { ok: true };
}
