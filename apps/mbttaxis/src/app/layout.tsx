import type { Metadata } from "next";
import { Poppins, Raleway } from "next/font/google";
import { CookieBanner } from "../components/CookieBanner";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { JsonLd } from "../components/JsonLd";
import { site } from "../../content/site";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
  variable: "--font-poppins",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
  variable: "--font-raleway",
  display: "swap",
});

const description =
  "Transport, taxi PMR et VSL à Bruxelles. Votre partenaire mobilité depuis 1991.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "MBT Taxis | mbttaxis",
    template: "%s",
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
    title: "MBT Taxis — Transport, Taxi PMR & VSL",
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MBT Taxis — Transport, Taxi PMR & VSL à Bruxelles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MBT Taxis — Transport, Taxi PMR & VSL",
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
      <body className="min-h-screen antialiased">
        <JsonLd />
        <Header />
        <main>{children}</main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
