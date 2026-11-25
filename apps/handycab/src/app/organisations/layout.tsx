import type { Metadata } from "next";
import { organisations } from "../../../content/pages";

export const metadata: Metadata = {
  title: organisations.seo.title,
  description: organisations.seo.description,
};

export default function OrganisationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
