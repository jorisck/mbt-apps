"use server";

import {
  contactSchema,
  quoteSchema,
  reservationSchema,
} from "../../lib/form-schemas";

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function submitReservation(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = reservationSchema.safeParse({
    service: formData.get("service"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes") || undefined,
    consent: formData.get("consent"),
    tripDate: formData.get("tripDate") || undefined,
    tripTime: formData.get("tripTime") || undefined,
    pickup: formData.get("pickup") || undefined,
    dropoff: formData.get("dropoff") || undefined,
    passengers: formData.get("passengers") || undefined,
    tripType: formData.get("tripType") || undefined,
    wheelchair: formData.get("wheelchair") || undefined,
    companion: formData.get("companion") || undefined,
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
  });

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Mock: no email send
  console.info("[mock] reservation", parsed.data);
  return { ok: true };
}

export async function submitQuote(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = quoteSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email"),
    vehicle: formData.get("vehicle"),
    floor: formData.get("floor") === "on",
    ramp: formData.get("ramp") === "on",
    details: formData.get("details") || undefined,
    desiredDate: formData.get("desiredDate") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  console.info("[mock] quote", parsed.data);
  return { ok: true };
}

export async function submitContact(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    subject: formData.get("subject"),
    message: formData.get("message"),
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  console.info("[mock] contact", parsed.data);
  return { ok: true };
}
