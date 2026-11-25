export const site = {
  name: "MBT Taxis",
  url: "https://www.mbttaxis.be",
  locale: "fr-BE",
  email: "pmr@mbt.be",
  phone: "+32 (0)2 426 45 53",
  phoneShort: "02 426 45 53",
  phoneHref: "tel:+3224264553",
  handycabUrl:
    process.env.NEXT_PUBLIC_HANDYCAB_URL ?? "https://handycab.vercel.app/application",
  handycabPhone: "+32 (0)2 315 31 00",
  handycabPhoneShort: "02 315 31 00",
  handycabPhoneHref: "tel:+3223153100",
  handycabBooking: "https://booking.handycab.be/",
  handycabPlay:
    "https://play.google.com/store/apps/details?id=be.handycab.android",
  handycabAppStore: "https://apps.apple.com/be/app/handycab/id1495297360",
  hours: "Du lundi au vendredi, de 8h à 17h",
  hoursShort: "lun.–ven. 8h–17h",
  agreement: "30.01.16",
  address: {
    street: "Rue des Béguines 160",
    city: "Molenbeek-Saint-Jean",
    postalCode: "1080",
    country: "BE",
    full: "Rue des Béguines 160, 1080 Molenbeek-Saint-Jean",
  },
} as const;
