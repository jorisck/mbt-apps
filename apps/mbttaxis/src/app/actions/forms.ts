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
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    tripAt: formData.get("tripAt"),
    bookingTime: formData.get("bookingTime") || undefined,
    pickup: formData.get("pickup"),
    dropoff: formData.get("dropoff"),
    wheelchair: formData.get("wheelchair"),
    notes: formData.get("notes") || undefined,
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
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  console.info("[mock] contact", parsed.data);
  return { ok: true };
}
