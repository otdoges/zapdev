import { Metadata } from "next";
import { Suspense } from "react";

import PageContent from "./page-content";
import { generateMetadata as generateSEOMetadata, generateStructuredData, generateFAQStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/seo/structured-data";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Zapdev - AI-Powered Development Platform | Build Apps 10x Faster',
  description: 'Create production-ready web applications with AI assistance. Support for React, Vue, Angular, Svelte, and Next.js. Build, test, and deploy in minutes, not days.',
  canonical: '/',
});

const Page = () => {
  const structuredData = [
    generateStructuredData('Organization', {}),
    generateStructuredData('WebApplication', {
      name: 'Zapdev Platform',
      description: 'AI-powered development platform for building web applications',
      screenshot: 'https://zapdev.link/screenshot.png',
      featureList: [
        'AI Code Generation',
        'Multi-Framework Support',
        'Instant Deployment',
        'Real-time Collaboration',
        'Version Control Integration'
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '2350'
      }
    }),
    generateFAQStructuredData([
      {
        question: 'What is Zapdev?',
        answer: 'Zapdev is an AI-powered development platform that helps you build web applications 10x faster. It supports all major frameworks including React, Vue, Angular, Svelte, and Next.js.'
      },
      {
        question: 'How does AI-powered development work?',
        answer: 'Simply describe what you want to build in natural language, and our AI will generate production-ready code. You can iterate, modify, and deploy your application all within the Zapdev platform.'
      },
      {
        question: 'Which frameworks does Zapdev support?',
        answer: 'Zapdev supports React, Vue.js, Angular, Svelte, and Next.js. We continuously add support for new frameworks and libraries based on community demand.'
      },
      {
        question: 'Is Zapdev suitable for production applications?',
        answer: 'Absolutely! Zapdev generates clean, maintainable code following industry best practices. Many companies use Zapdev to build and deploy production applications.'
      }
    ])
  ];

  return (
    <>
      <StructuredData data={structuredData} />
      <Suspense fallback={
        <div className="flex flex-col max-w-5xl mx-auto w-full items-center justify-center min-h-screen">
          <p>Loading...</p>
        </div>
      }>
        <PageContent />
      </Suspense>
    </>
  );
};
 
export default Page;
