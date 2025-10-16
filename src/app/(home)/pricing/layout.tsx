import type { Metadata } from "next";
import { buildPageMetadata } from "@/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing",
  description: "Choose the plan that fits your needs",
  path: "/pricing",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
