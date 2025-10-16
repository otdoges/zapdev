import { absoluteUrl } from "@/seo/config";

export function buildOgImageUrl(title?: string): string {
  const base = "/opengraph-image";
  if (!title) return absoluteUrl(base);
  const query = new URLSearchParams({ title }).toString();
  return absoluteUrl(`${base}?${query}`);
}
