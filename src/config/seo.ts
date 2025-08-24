// Comprehensive SEO Configuration for ZapDev
export const seoConfig = {
  // Site Information
  site: {
    name: 'ZapDev',
    url: 'https://zapdev.com',
    description: 'AI-powered development platform for building full-stack web applications',
    language: 'en',
    defaultLocale: 'en_US',
    supportedLocales: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
    twitterHandle: '@zapdev',
    facebookPage: 'zapdev',
    linkedinCompany: 'zapdev'
  },

  // Default Meta Tags
  defaults: {
    title: 'ZapDev - AI-Powered Development Platform | Build Full-Stack Apps in Minutes',
    description: 'ZapDev is the ultimate AI-powered development platform. Build full-stack web applications, MVPs, and SaaS products with AI code generation, real-time collaboration, and instant deployment.',
    keywords: [
      'AI development platform',
      'full-stack development',
      'code generation',
      'web app builder',
      'MVP development',
      'SaaS development',
      'React development',
      'TypeScript',
      'AI coding tools',
      'rapid prototyping',
      'developer tools',
      'startup tools',
      'web development',
      'application development',
      'AI coding assistant',
      'development platform',
      'code automation',
      'real-time collaboration',
      'instant deployment',
      'WebContainer',
      'Convex database',
      'Clerk authentication',
      'Stripe payments'
    ],
    author: 'ZapDev',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
  },

  // Page-specific SEO configurations
  pages: {
    home: {
      title: 'AI-Powered Development Platform',
      description: 'Build full-stack web applications, MVPs, and SaaS products with AI code generation, real-time collaboration, and instant deployment.',
      keywords: ['AI development', 'full-stack development', 'code generation', 'web app builder'],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'ZapDev',
        'url': 'https://zapdev.com',
        'description': 'AI-powered development platform for building full-stack web applications',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://zapdev.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }
    },

    pricing: {
      title: 'Pricing Plans',
      description: 'Choose the perfect ZapDev plan for your development needs. Free tier available with premium features for startups, developers, and enterprises.',
      keywords: ['pricing', 'plans', 'subscription', 'features', 'cost', 'free tier', 'premium features'],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'ZapDev Platform',
        'description': 'AI-powered development platform with multiple pricing tiers',
        'offers': {
          '@type': 'AggregateOffer',
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock',
          'offerCount': '4'
        }
      }
    },

    features: {
      title: 'Features & Capabilities',
      description: 'Explore ZapDev\'s powerful features including AI code generation, real-time collaboration, instant deployment, and comprehensive development tools.',
      keywords: ['features', 'capabilities', 'AI code generation', 'collaboration', 'deployment', 'development tools'],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'ZapDev',
        'applicationCategory': 'DeveloperApplication',
        'operatingSystem': 'Web',
        'featureList': [
          'AI-powered code generation',
          'Real-time collaboration',
          'Instant deployment',
          'WebContainer execution',
          'Full-stack development',
          'React & TypeScript support'
        ]
      }
    },

    blog: {
      title: 'Development Blog & Insights',
      description: 'Stay updated with the latest in AI development, coding tutorials, industry insights, and ZapDev platform updates.',
      keywords: ['blog', 'tutorials', 'insights', 'development', 'AI', 'coding', 'learning'],
      ogType: 'article',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        'name': 'ZapDev Blog',
        'description': 'Development insights and tutorials from the ZapDev team',
        'publisher': {
          '@type': 'Organization',
          'name': 'ZapDev',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://zapdev.com/favicon.svg'
          }
        }
      }
    },

    docs: {
      title: 'Documentation & Guides',
      description: 'Comprehensive documentation, tutorials, and guides to help you get the most out of ZapDev\'s AI-powered development platform.',
      keywords: ['documentation', 'guides', 'tutorials', 'help', 'API', 'integration', 'getting started'],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        'name': 'ZapDev Documentation',
        'description': 'Comprehensive guides and tutorials for ZapDev platform',
        'author': {
          '@type': 'Organization',
          'name': 'ZapDev'
        }
      }
    },

    about: {
      title: 'About ZapDev',
      description: 'Learn about ZapDev\'s mission to democratize AI-powered development and our team of experts building the future of software development.',
      keywords: ['about', 'team', 'mission', 'company', 'story', 'values'],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'ZapDev',
        'description': 'AI-powered development platform company',
        'url': 'https://zapdev.com',
        'logo': 'https://zapdev.com/favicon.svg',
        'sameAs': [
          'https://twitter.com/zapdev',
          'https://github.com/zapdev',
          'https://linkedin.com/company/zapdev'
        ]
      }
    },

    contact: {
      title: 'Contact Us',
      description: 'Get in touch with the ZapDev team. We\'re here to help with your development questions, support requests, and partnership opportunities.',
      keywords: ['contact', 'support', 'help', 'partnership', 'inquiry'],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        'name': 'Contact ZapDev',
        'description': 'Get in touch with the ZapDev team',
        'mainEntity': {
          '@type': 'Organization',
          'name': 'ZapDev',
          'contactPoint': {
            '@type': 'ContactPoint',
            'contactType': 'customer service',
            'email': 'team@zapdev.com'
          }
        }
      }
    }
  },

  // Blog post SEO template
  blogPost: (post: {
    title: string;
    description: string;
    author: string;
    publishedAt: string;
    updatedAt?: string;
    tags: string[];
    slug: string;
  }) => ({
    title: post.title,
    description: post.description,
    keywords: [...post.tags, 'blog', 'tutorial', 'development', 'AI'],
    ogType: 'article',
    canonical: `/blog/${post.slug}`,
    articlePublishedTime: post.publishedAt,
    articleModifiedTime: post.updatedAt || post.publishedAt,
    articleAuthor: post.author,
    articleTags: post.tags,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': post.title,
      'description': post.description,
      'author': {
        '@type': 'Person',
        'name': post.author
      },
      'datePublished': post.publishedAt,
      'dateModified': post.updatedAt || post.publishedAt,
      'publisher': {
        '@type': 'Organization',
        'name': 'ZapDev',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://zapdev.com/favicon.svg'
        }
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': `https://zapdev.com/blog/${post.slug}`
      }
    }
  }),

  // Feature page SEO template
  featurePage: (feature: {
    name: string;
    description: string;
    benefits: string[];
    useCases: string[];
  }) => ({
    title: `${feature.name} - ZapDev Feature`,
    description: feature.description,
    keywords: [feature.name.toLowerCase(), 'feature', 'capability', 'development', 'AI'],
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': `ZapDev ${feature.name}`,
      'description': feature.description,
      'applicationCategory': 'DeveloperApplication',
      'featureList': feature.benefits,
      'audience': {
        '@type': 'Audience',
        'audienceType': 'Developers'
      }
    }
  }),

  // Use case page SEO template
  useCasePage: (useCase: {
    title: string;
    description: string;
    industry: string;
    solutions: string[];
    benefits: string[];
  }) => ({
    title: `${useCase.title} - ZapDev Use Case`,
    description: useCase.description,
    keywords: [useCase.title.toLowerCase(), useCase.industry, 'use case', 'solution', 'development'],
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      'name': `${useCase.title} Development`,
      'description': useCase.description,
      'provider': {
        '@type': 'Organization',
        'name': 'ZapDev'
      },
      'serviceType': 'Software Development',
      'areaServed': 'Worldwide',
      'hasOfferCatalog': {
        '@type': 'OfferCatalog',
        'name': 'Development Solutions'
      }
    }
  }),

  // Social Media Configuration
  social: {
    twitter: {
      card: 'summary_large_image',
      site: '@zapdev',
      creator: '@zapdev',
      image: '/og-image.svg'
    },
    facebook: {
      appId: 'your-facebook-app-id',
      type: 'website',
      image: '/og-image.svg'
    },
    linkedin: {
      type: 'website',
      image: '/og-image.svg'
    }
  },

  // Performance & Core Web Vitals targets
  performance: {
    targets: {
      fcp: 1800, // First Contentful Paint < 1.8s
      lcp: 2500, // Largest Contentful Paint < 2.5s
      fid: 100,  // First Input Delay < 100ms
      cls: 0.1   // Cumulative Layout Shift < 0.1
    },
    budgets: {
      js: 300,   // JavaScript bundle < 300KB
      css: 50,   // CSS bundle < 50KB
      images: 1000, // Images < 1MB total
      fonts: 100 // Fonts < 100KB
    }
  },

  // Analytics & Tracking
  analytics: {
    googleAnalytics: 'G-XXXXXXXXXX', // Replace with actual GA4 ID
    googleTagManager: 'GTM-XXXXXXX', // Replace with actual GTM ID
    posthog: 'phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Replace with actual PostHog key
    hotjar: '0000000', // Replace with actual Hotjar ID
    mixpanel: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // Replace with actual Mixpanel key
  },

  // Search Console & Verification
  verification: {
    google: 'google-site-verification-code',
    bing: 'bing-verification-code',
    yandex: 'yandex-verification-code',
    baidu: 'baidu-verification-code'
  },

  // Security Headers
  security: {
    csp: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.gpteng.co'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'connect-src': ["'self'", 'https://api.openai.com', 'https://api.anthropic.com'],
      'frame-src': ["'none'"],
      'object-src': ["'none'"]
    },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '0',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  }
};

export default seoConfig;
