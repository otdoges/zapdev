import { Metadata } from 'next';
import { siteConfig } from './config';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
}

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    noindex = false,
    nofollow = false,
    ogImage = siteConfig.ogImage,
    ogType = 'website',
    publishedTime,
    modifiedTime,
    authors,
    section,
  } = config;

  const fullTitle = title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`;
  const canonicalUrl = canonical ? `${siteConfig.url}${canonical}` : undefined;
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${siteConfig.url}${ogImage}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: authors?.map(name => ({ name })),
    creator: siteConfig.name,
    publisher: siteConfig.name,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: ogType,
      locale: 'en_US',
      url: canonicalUrl,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(ogType === 'article' && {
        publishedTime,
        modifiedTime,
        authors: authors || [],
        section,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      creator: siteConfig.twitterHandle,
      images: [ogImageUrl],
    },
  };
}

export function generateProjectMetadata(project: { name: string; framework: string; updatedAt: Date }): Metadata {
  const title = `${project.name} - ${project.framework} Project`;
  const description = `Explore the ${project.name} project built with ${project.framework} on Zapdev. Create, edit, and deploy ${project.framework} applications with AI assistance.`;
  
  return generateMetadata({
    title,
    description,
    keywords: [
      project.framework.toLowerCase(),
      'web development',
      'ai development',
      'code generation',
      project.name,
      'zapdev',
    ],
    canonical: `/projects/${project.name}`,
    ogType: 'article',
    modifiedTime: project.updatedAt.toISOString(),
  });
}

export function generateFrameworkMetadata(framework: string): Metadata {
  const frameworkData: Record<string, { title: string; description: string; keywords: string[] }> = {
    nextjs: {
      title: 'Next.js AI Development Platform',
      description: 'Build Next.js applications with AI assistance. Create React Server Components, App Router pages, and full-stack Next.js apps through simple chat conversations.',
      keywords: ['nextjs', 'next.js', 'react', 'app router', 'server components', 'ai nextjs builder'],
    },
    react: {
      title: 'React AI Development Platform',
      description: 'Build React applications with AI assistance. Create components, hooks, and complete React apps through conversational AI.',
      keywords: ['react', 'react components', 'hooks', 'jsx', 'ai react builder', 'react development'],
    },
    vue: {
      title: 'Vue.js AI Development Platform',
      description: 'Build Vue.js applications with AI assistance. Create components, composables, and complete Vue apps with the power of AI.',
      keywords: ['vue', 'vue.js', 'vue 3', 'composition api', 'ai vue builder', 'vue development'],
    },
    angular: {
      title: 'Angular AI Development Platform',
      description: 'Build Angular applications with AI assistance. Create components, services, and complete Angular apps through AI-powered conversations.',
      keywords: ['angular', 'typescript', 'rxjs', 'ai angular builder', 'angular development'],
    },
    svelte: {
      title: 'Svelte AI Development Platform',
      description: 'Build Svelte applications with AI assistance. Create reactive components and complete Svelte apps with conversational AI.',
      keywords: ['svelte', 'sveltekit', 'reactive', 'ai svelte builder', 'svelte development'],
    },
  };

  const data = frameworkData[framework.toLowerCase()] || frameworkData.nextjs;

  return generateMetadata({
    title: data.title,
    description: data.description,
    keywords: [...data.keywords, 'web development', 'ai', 'code generation'],
    canonical: `/frameworks/${framework.toLowerCase()}`,
  });
}

export { siteConfig };
