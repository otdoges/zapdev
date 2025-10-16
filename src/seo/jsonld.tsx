import React from "react";
import { siteConfig } from "./config";

export type JsonObject = Record<string, unknown>;

export interface JsonLdProps {
  data: JsonObject | JsonObject[];
}

export function JsonLd({ data }: JsonLdProps) {
  const entries = Array.isArray(data) ? data : [data];
  return (
    <>
      {entries.map((entry, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </>
  );
}

export function organizationJsonLd(): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.organization.name,
    url: siteConfig.organization.url,
    logo: siteConfig.organization.logoUrl,
    description: siteConfig.description,
    sameAs: siteConfig.organization.sameAs ?? [],
  } satisfies JsonObject;
}

export function websiteJsonLd(): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
  } satisfies JsonObject;
}
