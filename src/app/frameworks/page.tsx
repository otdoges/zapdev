import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { generateMetadata } from "@/lib/seo/metadata";
import { StructuredData } from "@/components/seo/structured-data";
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = generateMetadata({
  title: "Supported Frameworks - Build with Any Frontend Framework",
  description: "Build applications with Next.js, React, Vue, Angular, or Svelte using AI. Choose your preferred framework and start building with conversational AI assistance.",
  keywords: [
    "nextjs",
    "react",
    "vue",
    "angular",
    "svelte",
    "web frameworks",
    "ai development",
    "framework support",
  ],
  canonical: "/frameworks",
});

const frameworks = [
  {
    id: "nextjs",
    name: "Next.js",
    description: "Build full-stack React applications with App Router, Server Components, and more",
    features: ["App Router", "Server Components", "API Routes", "Static & Dynamic Rendering"],
    color: "from-black to-gray-700",
  },
  {
    id: "react",
    name: "React",
    description: "Create interactive UIs with the most popular JavaScript library",
    features: ["Hooks", "Components", "State Management", "Virtual DOM"],
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "vue",
    name: "Vue.js",
    description: "Build progressive web applications with the approachable framework",
    features: ["Composition API", "Reactivity", "Single File Components", "Vue Router"],
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "angular",
    name: "Angular",
    description: "Develop enterprise-grade applications with TypeScript and RxJS",
    features: ["TypeScript", "Dependency Injection", "RxJS", "Angular CLI"],
    color: "from-red-600 to-pink-600",
  },
  {
    id: "svelte",
    name: "Svelte",
    description: "Build blazing fast apps with the compiler-based framework",
    features: ["Reactive", "No Virtual DOM", "Scoped Styles", "Built-in Animations"],
    color: "from-orange-500 to-red-500",
  },
];

export default function FrameworksPage() {
  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Frameworks", url: "/frameworks" },
        ])}
      />
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Build with Any Framework
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose your preferred frontend framework and let AI help you build amazing applications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {frameworks.map((framework) => (
            <Card key={framework.id} className="group hover:shadow-lg transition-all">
              <CardHeader>
                <div className={`w-full h-2 rounded-t-lg bg-gradient-to-r ${framework.color} mb-4`} />
                <CardTitle className="text-2xl">{framework.name}</CardTitle>
                <CardDescription className="text-base">
                  {framework.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {framework.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm">
                      <ArrowRight className="w-4 h-4 mr-2 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full group-hover:translate-x-1 transition-transform">
                  <Link href={`/frameworks/${framework.id}`}>
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
