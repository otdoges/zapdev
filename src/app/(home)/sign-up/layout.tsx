import type { Metadata } from "next";
import { buildPageMetadata } from "@/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Create account",
  description: "Sign up for ZapDev",
  path: "/sign-up",
  index: false,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
