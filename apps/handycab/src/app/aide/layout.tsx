import type { Metadata } from "next";
import { help } from "../../../content/pages";

export const metadata: Metadata = {
  title: help.seo.title,
  description: help.seo.description,
};

export default function AideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
