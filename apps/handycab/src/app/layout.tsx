import type { Metadata } from "next";
import { Poppins, Raleway } from "next/font/google";
import { Suspense } from "react";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { HeaderServer } from "../components/HeaderServer";
import { JsonLd } from "../components/JsonLd";
import { site } from "../../content/site";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-poppins",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-raleway",
  display: "swap",
});

const description =
  "Commandez immédiatement ou planifiez un taxi adapté PMR à Bruxelles avec Handycab. Réservation sur le web, l’application mobile ou par téléphone.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Handycab — Réserver un taxi PMR à Bruxelles",
    template: "%s | Handycab",
  },
  description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "fr_BE",
    url: site.url,
    siteName: site.name,
    title: "Handycab — Réserver un taxi PMR à Bruxelles",
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Handycab — Taxi PMR à Bruxelles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Handycab — Réserver un taxi PMR à Bruxelles",
    description,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-BE" className={`${poppins.variable} ${raleway.variable}`}>
      <body className="min-h-screen antialiased bg-white text-brand-dark">
        <a
          href="#contenu"
          className="absolute left-4 top-4 z-[100] -translate-y-[200%] rounded-full bg-brand-yellow px-4 py-2 text-sm font-bold text-brand-charcoal transition-transform focus:translate-y-0"
        >
          Aller au contenu
        </a>
        <JsonLd />
        <Suspense fallback={<Header />}>
          <HeaderServer />
        </Suspense>
        <main id="contenu">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
