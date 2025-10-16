import { Metadata } from "next";
import { generateMetadata } from "./metadata";
import { SEO_CONFIG } from "./config";

export const homePageMetadata: Metadata = generateMetadata({
  title: "Home",
  description: "Build apps and websites through intelligent conversation with Zapdev's AI-powered development platform. Transform your ideas into reality instantly.",
  keywords: [
    "AI development platform",
    "build apps with AI",
    "no-code development",
    "rapid prototyping",
    "intelligent coding assistant",
  ],
  canonical: "/",
});

export const pricingPageMetadata: Metadata = generateMetadata({
  title: "Pricing",
  description: "Affordable pricing plans for individuals, teams, and enterprises. Start building with Zapdev today with flexible monthly and annual options.",
  keywords: [
    "Zapdev pricing",
    "AI development pricing",
    "software development plans",
    "enterprise pricing",
  ],
  canonical: "/pricing",
});

export const featuresPageMetadata: Metadata = generateMetadata({
  title: "Features",
  description: "Discover Zapdev's powerful features: AI-powered development, multi-framework support, real-time collaboration, instant deployment, and enterprise security.",
  keywords: [
    "AI features",
    "development tools",
    "multi-framework support",
    "real-time collaboration",
    "instant deployment",
  ],
  canonical: "/features",
});

export const projectsPageMetadata: Metadata = generateMetadata({
  title: "Projects",
  description: "Manage and collaborate on your development projects with Zapdev's intuitive platform. Build, iterate, and deploy faster than ever.",
  keywords: [
    "project management",
    "development projects",
    "collaboration tools",
    "project dashboard",
  ],
  canonical: "/projects",
});

export const documentationPageMetadata: Metadata = generateMetadata({
  title: "Documentation",
  description: "Complete documentation and guides to help you build amazing applications with Zapdev. Learn about features, APIs, and best practices.",
  keywords: [
    "Zapdev documentation",
    "API documentation",
    "developer guides",
    "tutorials",
    "how-to guides",
  ],
  canonical: "/docs",
});

export const signInPageMetadata: Metadata = generateMetadata({
  title: "Sign In",
  description: "Sign in to your Zapdev account and continue building amazing applications with AI assistance.",
  canonical: "/sign-in",
  noIndex: true,
});

export const signUpPageMetadata: Metadata = generateMetadata({
  title: "Sign Up",
  description: "Create your Zapdev account and start building apps and websites with AI assistance. Join thousands of developers today.",
  canonical: "/sign-up",
});

export const notFoundPageMetadata: Metadata = generateMetadata({
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist. Return to Zapdev home to continue building.",
  canonical: "/404",
  noIndex: true,
  noFollow: true,
});

export const errorPageMetadata: Metadata = generateMetadata({
  title: "Error",
  description: "Something went wrong. Please try again or contact support if the problem persists.",
  canonical: "/error",
  noIndex: true,
  noFollow: true,
});

export function getProjectPageMetadata(projectId: string, projectName?: string): Metadata {
  return generateMetadata({
    title: projectName || `Project ${projectId}`,
    description: `View and manage your project: ${projectName || projectId}. Built with Zapdev's AI-powered development platform.`,
    canonical: `/projects/${projectId}`,
  });
}

export function getBlogPostMetadata(options: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  tags?: string[];
  image?: string;
}): Metadata {
  return generateMetadata({
    title: options.title,
    description: options.description,
    canonical: `/blog/${options.slug}`,
    publishedTime: options.publishedAt,
    modifiedTime: options.updatedAt,
    authors: options.author ? [options.author] : undefined,
    tags: options.tags,
    ogImage: options.image,
  });
}

export function getCategoryPageMetadata(category: string, description?: string): Metadata {
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  return generateMetadata({
    title: `${categoryName} Posts`,
    description: description || `Explore all ${categoryName.toLowerCase()} articles and tutorials on Zapdev.`,
    canonical: `/blog/category/${category}`,
  });
}

export function getAuthorPageMetadata(authorName: string, bio?: string): Metadata {
  return generateMetadata({
    title: `Articles by ${authorName}`,
    description: bio || `Read all articles written by ${authorName} on Zapdev.`,
    canonical: `/blog/author/${authorName.toLowerCase().replace(/\s+/g, "-")}`,
  });
}

export function getSearchPageMetadata(query?: string): Metadata {
  return generateMetadata({
    title: query ? `Search results for "${query}"` : "Search",
    description: query 
      ? `Search results for "${query}" on Zapdev` 
      : "Search for articles, documentation, and resources on Zapdev.",
    canonical: "/search",
    noIndex: true,
  });
}
