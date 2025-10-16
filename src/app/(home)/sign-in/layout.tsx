import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign in",
  description: "Sign in to your Zapdev account.",
  canonicalPath: "/sign-in",
});

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
