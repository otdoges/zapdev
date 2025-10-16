import React from "react";

export type JsonLdProps<T extends Record<string, unknown>> = {
  schema: T;
};

export function JsonLd<T extends Record<string, unknown>>({ schema }: JsonLdProps<T>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
