import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle } from "lucide-react";

import { generateMetadata } from "@/lib/seo/metadata";
import { StructuredData } from "@/components/seo/structured-data";
import { generateBreadcrumbSchema, generateHowToSchema } from "@/lib/seo/structured-data";
import { getRelatedUseCases } from "@/lib/seo/internal-linking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const useCases = ["landing-pages", "ecommerce", "dashboards", "saas", "mobile", "apis"] as const;
type UseCase = typeof useCases[number];

interface Props {
  params: Promise<{ useCase: string }>;
}

const useCaseData: Record<UseCase, {
  title: string;
  description: string;
  longDescription: string;
  benefits: string[];
  features: string[];
  steps: Array<{ title: string; description: string }>;
  examples: string[];
}> = {
  "landing-pages": {
    title: "Landing Pages",
    description: "Create high-converting landing pages with AI-powered development",
    longDescription: "Build beautiful, responsive landing pages that convert visitors into customers. AI helps you create professional designs with optimized copy, CTAs, and performance.",
    benefits: [
      "Fast development - build landing pages in minutes",
      "SEO optimized for better search rankings",
      "Mobile-responsive designs",
      "High-performance and fast loading",
      "A/B testing ready",
    ],
    features: [
      "Hero sections with compelling CTAs",
      "Feature showcases and benefits",
      "Social proof and testimonials",
      "Contact forms and lead capture",
      "Analytics integration",
    ],
    steps: [
      { title: "Define Your Goal", description: "Tell AI about your product and target audience" },
      { title: "AI Generates Design", description: "Get a professionally designed landing page" },
      { title: "Customize Content", description: "Refine copy and design with AI assistance" },
      { title: "Launch & Optimize", description: "Deploy and track conversion metrics" },
    ],
    examples: [
      "SaaS product launches",
      "Marketing campaigns",
      "Event registrations",
      "Lead generation",
    ],
  },
  "ecommerce": {
    title: "E-commerce Stores",
    description: "Build complete online stores with AI assistance",
    longDescription: "Create full-featured e-commerce platforms with product catalogs, shopping carts, and secure checkout. AI accelerates development while ensuring best practices.",
    benefits: [
      "Complete shopping experience",
      "Secure payment processing",
      "Inventory management",
      "Order tracking and fulfillment",
      "Customer accounts and wishlists",
    ],
    features: [
      "Product catalog with search and filters",
      "Shopping cart and checkout",
      "Payment gateway integration",
      "Order management system",
      "Customer reviews and ratings",
    ],
    steps: [
      { title: "Design Store Layout", description: "AI creates your store structure and design" },
      { title: "Add Products", description: "Set up product catalog with AI help" },
      { title: "Configure Payments", description: "Integrate payment processors" },
      { title: "Launch Store", description: "Go live and start selling" },
    ],
    examples: [
      "Fashion and apparel stores",
      "Digital product marketplaces",
      "Food and beverage delivery",
      "Electronics retailers",
    ],
  },
  "dashboards": {
    title: "Admin Dashboards",
    description: "Build powerful admin panels and data visualization dashboards with AI",
    longDescription: "Develop comprehensive admin dashboards with real-time data visualization, user management, and analytics. AI helps create intuitive interfaces for complex data.",
    benefits: [
      "Real-time data visualization",
      "Customizable widgets and charts",
      "User role management",
      "Activity monitoring and logs",
      "Export and reporting features",
    ],
    features: [
      "Interactive charts and graphs",
      "Data tables with sorting and filtering",
      "User and permission management",
      "Activity logs and audit trails",
      "API integration and webhooks",
    ],
    steps: [
      { title: "Define Data Sources", description: "Connect your data sources and APIs" },
      { title: "Design Dashboard", description: "AI creates visualizations and layouts" },
      { title: "Add Functionality", description: "Implement CRUD operations and filters" },
      { title: "Deploy Dashboard", description: "Launch your admin panel" },
    ],
    examples: [
      "Business analytics dashboards",
      "Content management systems",
      "User admin panels",
      "Monitoring and alerting systems",
    ],
  },
  "saas": {
    title: "SaaS Applications",
    description: "Develop subscription-based software services with AI",
    longDescription: "Build complete SaaS products with user authentication, subscription billing, and multi-tenancy. AI accelerates development of complex business logic and integrations.",
    benefits: [
      "Multi-tenant architecture",
      "Subscription and billing management",
      "User authentication and authorization",
      "API integrations",
      "Scalable infrastructure",
    ],
    features: [
      "User onboarding and authentication",
      "Subscription plans and billing",
      "Team collaboration features",
      "API and webhook integrations",
      "Usage analytics and reporting",
    ],
    steps: [
      { title: "Plan Features", description: "Define your SaaS product features and pricing" },
      { title: "Build Core App", description: "AI helps create the main application logic" },
      { title: "Add Billing", description: "Integrate subscription and payment systems" },
      { title: "Launch & Scale", description: "Deploy and grow your SaaS business" },
    ],
    examples: [
      "Project management tools",
      "CRM systems",
      "Marketing automation platforms",
      "Collaboration software",
    ],
  },
  "mobile": {
    title: "Mobile Applications",
    description: "Create responsive mobile apps with AI assistance",
    longDescription: "Build mobile-first applications that work seamlessly across all devices. AI helps create responsive designs and implement mobile-specific features.",
    benefits: [
      "Mobile-first responsive design",
      "Progressive Web App capabilities",
      "Offline functionality",
      "Push notifications",
      "App-like experience",
    ],
    features: [
      "Touch-optimized interfaces",
      "Offline data synchronization",
      "Push notification system",
      "Camera and media access",
      "Geolocation services",
    ],
    steps: [
      { title: "Design Mobile UI", description: "AI creates mobile-optimized layouts" },
      { title: "Add Mobile Features", description: "Implement offline support and notifications" },
      { title: "Test on Devices", description: "Ensure compatibility across devices" },
      { title: "Publish App", description: "Deploy as PWA or native wrapper" },
    ],
    examples: [
      "Social networking apps",
      "Fitness and health trackers",
      "Food delivery apps",
      "Travel and booking apps",
    ],
  },
  "apis": {
    title: "APIs & Backends",
    description: "Build robust backend APIs and serverless functions with AI",
    longDescription: "Develop scalable REST and GraphQL APIs with proper authentication, database integration, and serverless architecture. AI helps design efficient API structures and implementations.",
    benefits: [
      "RESTful and GraphQL APIs",
      "Serverless architecture",
      "Database integration",
      "Authentication and authorization",
      "API documentation",
    ],
    features: [
      "API endpoint design and implementation",
      "Database schema and migrations",
      "JWT authentication",
      "Rate limiting and caching",
      "Automatic API documentation",
    ],
    steps: [
      { title: "Design API Schema", description: "Define endpoints and data structures" },
      { title: "Implement Logic", description: "AI generates backend code and routes" },
      { title: "Add Security", description: "Implement authentication and rate limiting" },
      { title: "Deploy API", description: "Launch to serverless or cloud platforms" },
    ],
    examples: [
      "Microservices architecture",
      "Third-party integrations",
      "Data processing pipelines",
      "Real-time communication APIs",
    ],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { useCase } = await params;
  const useCaseKey = useCase.toLowerCase() as UseCase;
  
  if (!useCases.includes(useCaseKey)) {
    return {
      title: "Use Case Not Found",
      robots: { index: false, follow: false },
    };
  }

  const data = useCaseData[useCaseKey];

  return generateMetadata({
    title: `${data.title} - Build with AI`,
    description: data.description,
    keywords: [
      data.title.toLowerCase(),
      "ai development",
      "web development",
      "code generation",
      "zapdev",
    ],
    canonical: `/use-cases/${useCaseKey}`,
  });
}

export async function generateStaticParams() {
  return useCases.map((useCase) => ({
    useCase,
  }));
}

export default async function UseCasePage({ params }: Props) {
  const { useCase } = await params;
  const useCaseKey = useCase.toLowerCase() as UseCase;
  
  if (!useCases.includes(useCaseKey)) {
    notFound();
  }

  const data = useCaseData[useCaseKey];
  const relatedUseCases = getRelatedUseCases(3).filter(uc => uc.href !== `/use-cases/${useCaseKey}`);

  return (
    <>
      <StructuredData
        data={[
          generateBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Use Cases", url: "/use-cases" },
            { name: data.title, url: `/use-cases/${useCaseKey}` },
          ]),
          generateHowToSchema({
            name: `How to Build ${data.title} with AI`,
            description: data.description,
            steps: data.steps.map(step => ({ name: step.title, text: step.description })),
          }),
        ]}
      />
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Build {data.title} with AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {data.longDescription}
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/">
                Start Building
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/use-cases">View All Use Cases</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Key Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-500 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <ArrowRight className="w-5 h-5 mr-3 text-primary mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.steps.map((step, index) => (
              <Card key={step.title}>
                <CardHeader>
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-3">
                    {index + 1}
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Example Applications</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.examples.map((example) => (
              <div key={example} className="bg-muted p-4 rounded-lg text-center">
                {example}
              </div>
            ))}
          </div>
        </div>

        {relatedUseCases.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-center">Explore More Use Cases</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedUseCases.map((related) => (
                <Card key={related.href} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{related.title}</CardTitle>
                    <CardDescription>{related.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={related.href}>
                        Learn More
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
