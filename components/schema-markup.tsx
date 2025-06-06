"use client"

import { useEffect } from "react"
import Script from "next/script"

export default function SchemaMarkup() {
  // Structured data following schema.org SoftwareApplication format
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ZapDev",
    "applicationCategory": "WebApplication",
    "applicationSubCategory": "WebsiteBuilder",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "priceType": "https://schema.org/BasicPrice",
        "price": "0",
        "priceCurrency": "USD"
      }
    },
    "description": "ZapDev is an AI-powered web development tool that transforms natural language descriptions into stunning, responsive websites built with modern frameworks like Svelte, Astro, and React.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "125",
      "reviewCount": "78"
    },
    "featureList": "AI-Powered Design Language, Multiple Framework Support, One-Click Deployment, Responsive Designs, Clean Code Generation",
    "screenshot": "https://www.zapdev.ai/screenshots/main-interface.jpg",
    "softwareHelp": "https://www.zapdev.ai/docs",
    "author": {
      "@type": "Organization",
      "name": "ZapDev Team",
      "url": "https://www.zapdev.ai/about"
    },
    "inLanguage": "en-US",
    "potentialAction": {
      "@type": "UseAction",
      "target": "https://www.zapdev.ai/chat"
    }
  }

  return (
    <>
      <Script 
        id="schema-org-data" 
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Hidden for SEO purposes - only visible to screen readers */}
      <div className="sr-only">
        <h2>About ZapDev Web Development Tool</h2>
        <p>
          ZapDev is an AI-powered web development tool that helps designers and developers 
          create beautiful, responsive websites using modern frameworks like Svelte, Astro, and React.
        </p>
        <h3>Key Features</h3>
        <ul>
          <li>AI-Powered Design Language</li>
          <li>Multiple Framework Support including Svelte, Astro, React, Vue</li>
          <li>One-Click Deployment</li>
          <li>Responsive Design for all devices</li>
          <li>Clean Code Generation</li>
        </ul>
        <h3>Compatible Browsers</h3>
        <p>
          ZapDev works with all modern browsers including Chrome, Firefox, Safari, and Edge.
        </p>
        <h3>Supported Platforms</h3>
        <p>
          ZapDev is a web application accessible from any device with a modern web browser.
        </p>
      </div>
    </>
  )
} 