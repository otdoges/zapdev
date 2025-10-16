import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe, ShoppingCart, LayoutDashboard, Rocket, Smartphone, Server } from "lucide-react";

import { generateMetadata } from "@/lib/seo/metadata";
import { StructuredData } from "@/components/seo/structured-data";
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = generateMetadata({
  title: "Use Cases - Build Any Type of Application with AI",
  description: "Explore what you can build with Zapdev. From landing pages to SaaS applications, e-commerce stores to admin dashboards - build anything with AI assistance.",
  keywords: [
    "use cases",
    "ai applications",
    "web development",
    "saas development",
    "ecommerce",
    "landing pages",
    "dashboards",
  ],
  canonical: "/use-cases",
});

const useCases = [
  {
    id: "landing-pages",
    name: "Landing Pages",
    description: "Create high-converting landing pages with beautiful designs and optimized performance",
    icon: Globe,
    features: ["Responsive Design", "SEO Optimized", "Fast Loading", "Conversion Focused"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "ecommerce",
    name: "E-commerce Stores",
    description: "Build complete online stores with product catalogs, shopping carts, and checkout flows",
    icon: ShoppingCart,
    features: ["Product Management", "Shopping Cart", "Payment Integration", "Order Tracking"],
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "dashboards",
    name: "Admin Dashboards",
    description: "Develop powerful admin panels and data visualization dashboards",
    icon: LayoutDashboard,
    features: ["Data Visualization", "User Management", "Analytics", "Real-time Updates"],
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "saas",
    name: "SaaS Applications",
    description: "Create subscription-based software services with user authentication and billing",
    icon: Rocket,
    features: ["User Authentication", "Subscription Billing", "Multi-tenancy", "API Integration"],
    color: "from-orange-500 to-red-500",
  },
  {
    id: "mobile",
    name: "Mobile Apps",
    description: "Build responsive mobile applications that work seamlessly on all devices",
    icon: Smartphone,
    features: ["Mobile-First Design", "Progressive Web App", "Offline Support", "Push Notifications"],
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "apis",
    name: "APIs & Backends",
    description: "Develop robust backend APIs and serverless functions",
    icon: Server,
    features: ["REST & GraphQL APIs", "Database Integration", "Authentication", "Serverless Functions"],
    color: "from-gray-600 to-gray-800",
  },
];

export default function UseCasesPage() {
  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Use Cases", url: "/use-cases" },
        ])}
      />
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Build Anything with AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From simple landing pages to complex SaaS applications - AI can help you build it all
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {useCases.map((useCase) => (
            <Card key={useCase.id} className="group hover:shadow-lg transition-all">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${useCase.color} flex items-center justify-center mb-4`}>
                  <useCase.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">{useCase.name}</CardTitle>
                <CardDescription className="text-base">
                  {useCase.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {useCase.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm">
                      <ArrowRight className="w-4 h-4 mr-2 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full group-hover:translate-x-1 transition-transform">
                  <Link href={`/use-cases/${useCase.id}`}>
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Building?</h2>
          <p className="text-muted-foreground mb-6">
            Create your first project with AI assistance
          </p>
          <Button asChild size="lg">
            <Link href="/">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
