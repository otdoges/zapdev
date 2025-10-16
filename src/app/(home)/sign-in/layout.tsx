import type { Metadata } from "next";
import { buildPageMetadata } from "@/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign in",
  description: "Access your ZapDev account",
  path: "/sign-in",
  index: false,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
