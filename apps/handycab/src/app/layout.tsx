import type { Metadata } from "next";
import { Poppins, Raleway } from "next/font/google";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
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
  "Transport conventionné pour personnes à mobilité réduite à Bruxelles. Flotte électrique TPMR, chauffeurs secouristes, dispatch 24/7. Un service de MBT Taxis.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "HandyCab • Transport PMR & mobilité adaptée à Bruxelles",
    template: "%s | HandyCab",
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
    title: "HandyCab — Transport PMR à Bruxelles",
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HandyCab — Transport PMR & mobilité adaptée à Bruxelles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HandyCab — Transport PMR à Bruxelles",
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
        <JsonLd />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
