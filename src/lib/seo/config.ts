export const siteConfig = {
  name: 'Zapdev',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://zapdev.link',
  description: 'Build apps and websites by chatting with AI. Transform your ideas into reality with our AI-powered development platform.',
  keywords: [
    'ai development',
    'code generation',
    'web development',
    'nextjs',
    'react',
    'vue',
    'angular',
    'svelte',
  ],
  ogImage: '/og-image.png',
  twitterHandle: '@zapdev',
  defaultMetadata: {
    authors: [{ name: 'Zapdev' }],
    creator: 'Zapdev',
    publisher: 'Zapdev',
  },
} as const;

export const frameworks = [
  { id: 'nextjs', name: 'Next.js' },
  { id: 'react', name: 'React' },
  { id: 'vue', name: 'Vue.js' },
  { id: 'angular', name: 'Angular' },
  { id: 'svelte', name: 'Svelte' },
] as const;

export const useCases = [
  { id: 'landing-pages', name: 'Landing Pages' },
  { id: 'ecommerce', name: 'E-commerce' },
  { id: 'dashboards', name: 'Dashboards' },
  { id: 'saas', name: 'SaaS' },
  { id: 'mobile', name: 'Mobile Apps' },
  { id: 'apis', name: 'APIs & Backends' },
] as const;

export type Framework = typeof frameworks[number]['id'];
export type UseCase = typeof useCases[number]['id'];
