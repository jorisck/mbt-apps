import type { MetadataRoute } from "next";
import { site } from "../../content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/reservation-tpmr",
    "/tarifs-vsl",
    "/adaptation-tpmr",
    "/location-vente",
    "/about-us",
    "/contactus",
    "/cookie-policy",
  ];

  return paths.map((path) => ({
    url: `${site.url}${path === "/" ? "" : path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
