import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign up",
  description: "Create your Zapdev account.",
  canonicalPath: "/sign-up",
});

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
