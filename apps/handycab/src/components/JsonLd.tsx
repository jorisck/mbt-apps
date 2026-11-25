import { site } from "../../content/site";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["TaxiService", "LocalBusiness"],
    name: site.name,
    description: site.tagline,
    url: site.url,
    logo: `${site.url}/logo.png`,
    image: `${site.url}/og-image.png`,
    email: site.email,
    telephone: site.phoneDisplay,
    parentOrganization: {
      "@type": "Organization",
      name: site.parent.name,
      url: site.parent.url,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    areaServed: "Bruxelles",
    sameAs: [site.playStoreUrl, site.appStoreUrl],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
