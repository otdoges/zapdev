import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Code, Zap, Shield, Sparkles } from "lucide-react";

import { generateFrameworkMetadata } from "@/lib/seo/metadata";
import { StructuredData } from "@/components/seo/structured-data";
import { generateBreadcrumbSchema, generateHowToSchema } from "@/lib/seo/structured-data";
import { getRelatedFrameworks } from "@/lib/seo/internal-linking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const frameworks = ["nextjs", "react", "vue", "angular", "svelte"] as const;
type Framework = typeof frameworks[number];

interface Props {
  params: Promise<{ framework: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { framework } = await params;
  
  if (!frameworks.includes(framework.toLowerCase() as Framework)) {
    return {
      title: "Framework Not Found",
      robots: { index: false, follow: false },
    };
  }

  return generateFrameworkMetadata(framework);
}

export async function generateStaticParams() {
  return frameworks.map((framework) => ({
    framework,
  }));
}

const frameworkData: Record<Framework, {
  name: string;
  tagline: string;
  description: string;
  features: Array<{ icon: typeof Code; title: string; description: string }>;
  useCases: string[];
  codeExample: string;
}> = {
  nextjs: {
    name: "Next.js",
    tagline: "The React Framework for Production",
    description: "Build full-stack React applications with App Router, Server Components, and built-in optimizations. Let AI help you create performant Next.js apps with ease.",
    features: [
      { icon: Code, title: "App Router", description: "Modern routing with layouts, loading states, and error handling" },
      { icon: Zap, title: "Server Components", description: "Zero-bundle server-side React components" },
      { icon: Shield, title: "Built-in Optimizations", description: "Automatic image, font, and script optimizations" },
      { icon: Sparkles, title: "API Routes", description: "Create API endpoints with serverless functions" },
    ],
    useCases: ["E-commerce sites", "Marketing websites", "SaaS applications", "Blogs & Content sites"],
    codeExample: `// App Router with Server Components
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}`,
  },
  react: {
    name: "React",
    tagline: "A JavaScript Library for Building User Interfaces",
    description: "Create interactive and dynamic user interfaces with React. AI-powered development makes building React applications faster than ever.",
    features: [
      { icon: Code, title: "Component-Based", description: "Build encapsulated components that manage their own state" },
      { icon: Zap, title: "Virtual DOM", description: "Efficient updates and rendering" },
      { icon: Shield, title: "Hooks", description: "Use state and other React features without writing classes" },
      { icon: Sparkles, title: "Rich Ecosystem", description: "Extensive library of components and tools" },
    ],
    useCases: ["Single Page Applications", "Interactive dashboards", "Mobile apps with React Native", "Progressive Web Apps"],
    codeExample: `// React Component with Hooks
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}`,
  },
  vue: {
    name: "Vue.js",
    tagline: "The Progressive JavaScript Framework",
    description: "Build modern web interfaces with Vue's approachable and versatile framework. AI makes Vue development intuitive and productive.",
    features: [
      { icon: Code, title: "Composition API", description: "Flexible and powerful component composition" },
      { icon: Zap, title: "Reactivity System", description: "Automatic dependency tracking and updates" },
      { icon: Shield, title: "Single File Components", description: "Organize template, script, and style in one file" },
      { icon: Sparkles, title: "Vue Router", description: "Official routing solution for Vue applications" },
    ],
    useCases: ["Progressive Web Apps", "Enterprise applications", "Interactive prototypes", "Admin panels"],
    codeExample: `<!-- Vue Single File Component -->
<script setup>
import { ref } from 'vue';
const count = ref(0);
</script>
<template>
  <button @click="count++">{{ count }}</button>
</template>`,
  },
  angular: {
    name: "Angular",
    tagline: "Platform for Building Web Applications",
    description: "Develop enterprise-grade applications with Angular's comprehensive framework. AI assistance streamlines Angular development workflows.",
    features: [
      { icon: Code, title: "TypeScript First", description: "Built with TypeScript for type safety" },
      { icon: Zap, title: "Dependency Injection", description: "Powerful DI system for scalable architecture" },
      { icon: Shield, title: "RxJS Integration", description: "Reactive programming with observables" },
      { icon: Sparkles, title: "Angular CLI", description: "Powerful command-line interface" },
    ],
    useCases: ["Enterprise applications", "Large-scale SPAs", "Admin dashboards", "Complex data-driven apps"],
    codeExample: `// Angular Component
@Component({
  selector: 'app-counter',
  template: '<button (click)="increment()">{{count}}</button>'
})
export class CounterComponent {
  count = 0;
  increment() { this.count++; }
}`,
  },
  svelte: {
    name: "Svelte",
    tagline: "Cybernetically Enhanced Web Apps",
    description: "Build blazing fast applications with Svelte's compiler-based approach. AI-powered development makes Svelte even more powerful.",
    features: [
      { icon: Code, title: "Truly Reactive", description: "Reactivity without a virtual DOM" },
      { icon: Zap, title: "Compile-Time Magic", description: "Smaller bundles and faster runtime" },
      { icon: Shield, title: "Scoped Styles", description: "CSS scoping without additional libraries" },
      { icon: Sparkles, title: "Built-in Animations", description: "Smooth transitions and animations" },
    ],
    useCases: ["High-performance apps", "Interactive visualizations", "Real-time applications", "Mobile-first web apps"],
    codeExample: `<!-- Svelte Component -->
<script>
  let count = 0;
</script>
<button on:click={() => count++}>
  {count}
</button>`,
  },
};

export default async function FrameworkPage({ params }: Props) {
  const { framework } = await params;
  const frameworkKey = framework.toLowerCase() as Framework;
  
  if (!frameworks.includes(frameworkKey)) {
    notFound();
  }

  const data = frameworkData[frameworkKey];
  const relatedFrameworks = getRelatedFrameworks(frameworkKey);

  return (
    <>
      <StructuredData
        data={[
          generateBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Frameworks", url: "/frameworks" },
            { name: data.name, url: `/frameworks/${frameworkKey}` },
          ]),
          generateHowToSchema({
            name: `How to Build ${data.name} Apps with AI`,
            description: `Learn how to create ${data.name} applications using AI-powered development`,
            steps: [
              { name: "Create a Project", text: `Start a new ${data.name} project on Zapdev` },
              { name: "Describe Your App", text: "Tell the AI what you want to build" },
              { name: "Review Generated Code", text: `AI generates optimized ${data.name} code` },
              { name: "Iterate & Deploy", text: "Refine with AI and deploy your application" },
            ],
          }),
        ]}
      />
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Build {data.name} Apps with AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {data.description}
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/">
                Start Building
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/frameworks">View All Frameworks</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {data.features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <feature.icon className="w-6 h-6 text-primary" />
                  <CardTitle>{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-6">Perfect For</h2>
            <ul className="space-y-3">
              {data.useCases.map((useCase) => (
                <li key={useCase} className="flex items-center">
                  <ArrowRight className="w-5 h-5 mr-3 text-primary" />
                  <span className="text-lg">{useCase}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6">Example Code</h2>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code className="text-sm">{data.codeExample}</code>
            </pre>
          </div>
        </div>

        {relatedFrameworks.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-center">Explore Other Frameworks</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedFrameworks.map((related) => (
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
