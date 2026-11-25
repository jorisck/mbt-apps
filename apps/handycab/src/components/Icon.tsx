type IconName =
  | "accessible"
  | "arrow"
  | "phone"
  | "calc"
  | "origin"
  | "pin"
  | "calendar"
  | "clock"
  | "shield"
  | "heart"
  | "user"
  | "check"
  | "ramp"
  | "seat"
  | "star"
  | "eye"
  | "share"
  | "sync"
  | "apple"
  | "android"
  | "car"
  | "verified";

const map: Record<IconName, string> = {
  accessible: "fa-wheelchair",
  arrow: "fa-arrow-right",
  phone: "fa-phone",
  calc: "fa-calculator",
  origin: "fa-circle-o",
  pin: "fa-map-marker",
  calendar: "fa-calendar",
  clock: "fa-clock-o",
  shield: "fa-shield",
  heart: "fa-heartbeat",
  user: "fa-user",
  check: "fa-check-circle",
  ramp: "fa-road",
  seat: "fa-seat",
  star: "fa-star",
  eye: "fa-eye",
  share: "fa-share-alt",
  sync: "fa-refresh",
  apple: "fa-apple",
  android: "fa-android",
  car: "fa-car",
  verified: "fa-check-circle",
};

/** Font Awesome 4.7 — `fa-seat` n'existe pas, fallback sofa/user */
const fallback: Partial<Record<IconName, string>> = {
  seat: "fa-user",
};

export function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const fa = fallback[name] ?? map[name];
  return <i className={`fa ${fa} ${className}`} aria-hidden />;
}
