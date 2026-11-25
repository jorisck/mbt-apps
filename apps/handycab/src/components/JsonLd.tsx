import { site } from "../../content/site";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["TaxiService", "LocalBusiness"],
    name: site.name,
    url: site.url,
    logo: `${site.url}/logo.png`,
    image: `${site.url}/og-image.png`,
    email: site.email,
    telephone: site.phone,
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
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
