"use server";

import { headers } from "next/headers";
import { api } from "@mbt/api-client/server";
import {
  contactSchema,
  quoteSchema,
  reservationSchema,
} from "../../lib/form-schemas";
import { problemToFormState, toDemandeCreate, toMessageCreate } from "../../lib/api-map";

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

async function endUserIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
}

export async function submitReservation(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = reservationSchema.safeParse({
    service: formData.get("service"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes") || undefined,
    consent: formData.get("consent"),
    healthConsent: formData.get("healthConsent") || undefined,
    tripDate: formData.get("tripDate") || undefined,
    tripTime: formData.get("tripTime") || undefined,
    returnDate: formData.get("returnDate") || undefined,
    returnTime: formData.get("returnTime") || undefined,
    pickup: formData.get("pickup") || undefined,
    dropoff: formData.get("dropoff") || undefined,
    passengerCount: formData.get("passengerCount") || undefined,
    tripType: formData.get("tripType") || undefined,
    wheelchair: formData.get("wheelchair") || undefined,
    wheelchairNotes: formData.get("wheelchairNotes") || undefined,
    companions: formData.get("companions") || undefined,
    doorToDoor: formData.get("doorToDoor") || undefined,
    staysInWheelchair: formData.get("staysInWheelchair") || undefined,
    vehicleBrand: formData.get("vehicleBrand") || undefined,
    vehicleModel: formData.get("vehicleModel") || undefined,
    vehicleYear: formData.get("vehicleYear") || undefined,
    adaptationType: formData.get("adaptationType") || undefined,
    wheelchairType: formData.get("wheelchairType") || undefined,
    desiredDate: formData.get("desiredDate") || undefined,
    searchType: formData.get("searchType") || undefined,
    vehicleWish: formData.get("vehicleWish") || undefined,
    pmrVehicle: formData.get("pmrVehicle") || undefined,
    budget: formData.get("budget") || undefined,
    delay: formData.get("delay") || undefined,
    idempotencyKey: formData.get("idempotencyKey") || undefined,
    elapsedMs: formData.get("elapsedMs") || undefined,
    hp: formData.get("hp") || "",
  });

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const ip = await endUserIp();
  const transport = ["business", "quotidien", "vsl", "pmr"].includes(parsed.data.service);

  if (transport) {
    const { error } = await api.POST("/v1/demandes", {
      params: {
        header: {
          "Idempotency-Key": parsed.data.idempotencyKey || crypto.randomUUID(),
          "X-End-User-IP": ip,
        },
      },
      body: toDemandeCreate(parsed.data) as never,
    });
    if (error) return problemToFormState(error);
    return { ok: true };
  }

  const kind = parsed.data.service === "adaptation" ? "adaptation" : "location_sale";
  const { error } = await api.POST("/v1/messages", {
    params: { header: { "X-End-User-IP": ip } },
    body: toMessageCreate(kind, parsed.data) as never,
  });
  if (error) return problemToFormState(error);
  return { ok: true };
}

export async function submitQuote(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = quoteSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email"),
    vehicle: formData.get("vehicle"),
    floor: formData.get("floor") === "on",
    ramp: formData.get("ramp") === "on",
    details: formData.get("details") || undefined,
    desiredDate: formData.get("desiredDate") || undefined,
    consent: formData.get("consent"),
    elapsedMs: formData.get("elapsedMs") || undefined,
    hp: formData.get("hp") || "",
  });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { error } = await api.POST("/v1/messages", {
    params: { header: { "X-End-User-IP": await endUserIp() } },
    body: toMessageCreate("quote", parsed.data) as never,
  });
  if (error) return problemToFormState(error);
  return { ok: true };
}

export async function submitContact(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = contactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    subject: formData.get("subject"),
    message: formData.get("message"),
    consent: formData.get("consent"),
    elapsedMs: formData.get("elapsedMs") || undefined,
    hp: formData.get("hp") || "",
  });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { error } = await api.POST("/v1/messages", {
    params: { header: { "X-End-User-IP": await endUserIp() } },
    body: toMessageCreate("contact", parsed.data) as never,
  });
  if (error) return problemToFormState(error);
  return { ok: true };
}
