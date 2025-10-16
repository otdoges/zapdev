export interface RelatedLink {
  title: string;
  href: string;
  description?: string;
}

export const frameworkLinks: Record<string, RelatedLink[]> = {
  nextjs: [
    { title: 'React Development', href: '/frameworks/react', description: 'Build React applications with AI' },
    { title: 'Vue.js Development', href: '/frameworks/vue', description: 'Build Vue.js applications with AI' },
    { title: 'All Frameworks', href: '/frameworks', description: 'Explore all supported frameworks' },
  ],
  react: [
    { title: 'Next.js Development', href: '/frameworks/nextjs', description: 'Build Next.js applications with AI' },
    { title: 'Angular Development', href: '/frameworks/angular', description: 'Build Angular applications with AI' },
    { title: 'All Frameworks', href: '/frameworks', description: 'Explore all supported frameworks' },
  ],
  vue: [
    { title: 'React Development', href: '/frameworks/react', description: 'Build React applications with AI' },
    { title: 'Svelte Development', href: '/frameworks/svelte', description: 'Build Svelte applications with AI' },
    { title: 'All Frameworks', href: '/frameworks', description: 'Explore all supported frameworks' },
  ],
  angular: [
    { title: 'React Development', href: '/frameworks/react', description: 'Build React applications with AI' },
    { title: 'Vue.js Development', href: '/frameworks/vue', description: 'Build Vue.js applications with AI' },
    { title: 'All Frameworks', href: '/frameworks', description: 'Explore all supported frameworks' },
  ],
  svelte: [
    { title: 'React Development', href: '/frameworks/react', description: 'Build React applications with AI' },
    { title: 'Next.js Development', href: '/frameworks/nextjs', description: 'Build Next.js applications with AI' },
    { title: 'All Frameworks', href: '/frameworks', description: 'Explore all supported frameworks' },
  ],
};

export const useCaseLinks: RelatedLink[] = [
  { title: 'Landing Pages', href: '/use-cases/landing-pages', description: 'Build beautiful landing pages with AI' },
  { title: 'E-commerce', href: '/use-cases/ecommerce', description: 'Create e-commerce stores with AI' },
  { title: 'Dashboards', href: '/use-cases/dashboards', description: 'Build admin dashboards with AI' },
  { title: 'SaaS Applications', href: '/use-cases/saas', description: 'Develop SaaS products with AI' },
  { title: 'Mobile Apps', href: '/use-cases/mobile', description: 'Create mobile applications with AI' },
  { title: 'APIs & Backends', href: '/use-cases/apis', description: 'Build APIs and backends with AI' },
];

export const resourceLinks: RelatedLink[] = [
  { title: 'Documentation', href: '/docs', description: 'Learn how to use Zapdev' },
  { title: 'Tutorials', href: '/tutorials', description: 'Step-by-step guides and tutorials' },
  { title: 'Examples', href: '/examples', description: 'Browse example projects' },
  { title: 'Blog', href: '/blog', description: 'Latest news and updates' },
  { title: 'Community', href: '/community', description: 'Join our developer community' },
];

export function getRelatedFrameworks(currentFramework: string): RelatedLink[] {
  return frameworkLinks[currentFramework.toLowerCase()] || [];
}

export function getRelatedUseCases(count: number = 3): RelatedLink[] {
  return useCaseLinks.slice(0, count);
}

export function getRelatedResources(count: number = 3): RelatedLink[] {
  return resourceLinks.slice(0, count);
}

export function generateInternalLinks(type: 'framework' | 'usecase' | 'resource', context?: string): RelatedLink[] {
  switch (type) {
    case 'framework':
      return context ? getRelatedFrameworks(context) : Object.values(frameworkLinks).flat().slice(0, 3);
    case 'usecase':
      return getRelatedUseCases();
    case 'resource':
      return getRelatedResources();
    default:
      return [];
  }
}
