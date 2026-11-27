import type { ReservationInput, QuoteInput, ContactInput } from "./form-schemas";

const SERVICE_MAP = {
  business: "business",
  quotidien: "daily",
  vsl: "vsl",
  pmr: "pmr",
} as const;

const WHEELCHAIR_MAP = {
  non: "none",
  manuel: "manual_wheelchair",
  electrique: "electric_wheelchair",
  preciser: "other",
} as const;

export type Problem = {
  code?: string;
  detail?: string;
  errors?: Record<string, string>;
};

export function problemToFormState(error: unknown): {
  ok: false;
  message?: string;
  errors?: Record<string, string[]>;
} {
  const problem = (error ?? {}) as Problem;
  const errors: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(problem.errors ?? {})) {
    errors[key] = [value];
  }
  return {
    ok: false,
    message: problem.detail || "L'envoi a échoué. Vérifiez les champs et réessayez.",
    errors: Object.keys(errors).length ? errors : undefined,
  };
}

export function toDemandeCreate(data: ReservationInput) {
  const service = SERVICE_MAP[data.service as keyof typeof SERVICE_MAP];
  const pickupAt = `${data.tripDate}T${data.tripTime}`;
  const returnAt =
    data.tripType === "aller-retour" && data.returnDate && data.returnTime
      ? `${data.returnDate}T${data.returnTime}`
      : null;
  const mobility = WHEELCHAIR_MAP[data.wheelchair ?? "non"];
  const hasNeeds = mobility !== "none" || (data.companions ?? 0) > 0 || data.doorToDoor === "on";
  return {
    service,
    pickup_at: pickupAt,
    pickup: { formatted: data.pickup! },
    dropoff: { formatted: data.dropoff! },
    return_at: returnAt,
    return_pickup: null,
    passenger_count: data.passengerCount ?? 1,
    passenger: {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      email: data.email,
      language: "fr" as const,
    },
    needs: hasNeeds
      ? {
          mobility_aid: mobility,
          stays_in_wheelchair: data.staysInWheelchair === "on",
          companions: data.companions ?? 0,
          door_to_door: data.doorToDoor === "on",
          notes: data.wheelchairNotes || data.notes || null,
        }
      : null,
    health_consent: hasNeeds,
    privacy_consent: true,
    comment: data.notes || null,
    antispam: { hp: data.hp ?? "", elapsed_ms: data.elapsedMs ?? 0 },
  };
}

export function toMessageCreate(
  kind: "contact" | "quote" | "adaptation" | "location_sale",
  data: ReservationInput | QuoteInput | ContactInput,
) {
  if ("subject" in data && "message" in data) {
    const c = data as ContactInput;
    return {
      kind,
      first_name: c.firstName,
      last_name: c.lastName,
      email: c.email,
      phone: c.phone || null,
      subject: c.subject,
      body: c.message,
      privacy_consent: true,
      details: {},
      antispam: { hp: c.hp ?? "", elapsed_ms: c.elapsedMs ?? 0 },
    };
  }
  if ("vehicle" in data) {
    const q = data as QuoteInput;
    return {
      kind,
      first_name: q.firstName,
      last_name: q.lastName,
      email: q.email,
      phone: q.phone || null,
      subject: "Devis adaptation",
      body: q.details || "Demande de devis",
      privacy_consent: true,
      details: {
        vehicle: q.vehicle,
        floor: q.floor,
        ramp: q.ramp,
        desiredDate: q.desiredDate,
      },
      antispam: { hp: q.hp ?? "", elapsed_ms: q.elapsedMs ?? 0 },
    };
  }
  const r = data as ReservationInput;
  return {
    kind,
    first_name: r.firstName,
    last_name: r.lastName,
    email: r.email,
    phone: r.phone,
    subject: kind === "adaptation" ? "Adaptation de véhicule" : "Location / vente",
    body: r.notes || "—",
    privacy_consent: true,
    details: {
      vehicleBrand: r.vehicleBrand,
      vehicleModel: r.vehicleModel,
      vehicleYear: r.vehicleYear,
      adaptationType: r.adaptationType,
      wheelchairType: r.wheelchairType,
      desiredDate: r.desiredDate,
      searchType: r.searchType,
      vehicleWish: r.vehicleWish,
      pmrVehicle: r.pmrVehicle,
      budget: r.budget,
      delay: r.delay,
    },
    antispam: { hp: r.hp ?? "", elapsed_ms: r.elapsedMs ?? 0 },
  };
}
