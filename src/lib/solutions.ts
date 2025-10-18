import { memoize } from './cache';

export interface SolutionData {
  slug: string;
  title: string;
  heading: string;
  description: string;
  metaDescription: string;
  keywords: string[];
  features: {
    title: string;
    description: string;
    icon: string;
  }[];
  benefits: string[];
  useCases: {
    title: string;
    description: string;
  }[];
  cta: {
    title: string;
    description: string;
  };
}

export const solutions: Record<string, SolutionData> = {
  'ai-code-generation': {
    slug: 'ai-code-generation',
    title: 'AI Code Generation - Write Code 10x Faster',
    heading: 'AI-Powered Code Generation Platform',
    description: 'Transform your ideas into production-ready code with our advanced AI code generation platform. Support for all major frameworks and languages.',
    metaDescription: 'Generate high-quality code instantly with AI. Build React, Vue, Angular, and Next.js applications 10x faster. Start free with Zapdev\'s code generation platform.',
    keywords: [
      'AI code generation',
      'automatic code generation',
      'AI programming',
      'code generator',
      'AI developer tools',
      'automated coding',
      'intelligent code completion',
      'AI pair programming'
    ],
    features: [
      {
        title: 'Natural Language to Code',
        description: 'Describe what you want to build in plain English and watch AI generate the code',
        icon: '💬'
      },
      {
        title: 'Multi-Framework Support',
        description: 'Generate code for React, Vue, Angular, Svelte, and Next.js',
        icon: '🔧'
      },
      {
        title: 'Production-Ready Output',
        description: 'Get clean, maintainable code that follows best practices',
        icon: '✨'
      },
      {
        title: 'Instant Preview',
        description: 'See your application running in real-time as you build',
        icon: '👁️'
      }
    ],
    benefits: [
      'Reduce development time by 90%',
      'No more boilerplate code',
      'Consistent code quality',
      'Built-in best practices',
      'Automatic error handling',
      'Type-safe code generation'
    ],
    useCases: [
      {
        title: 'Rapid Prototyping',
        description: 'Build MVPs and prototypes in minutes instead of weeks'
      },
      {
        title: 'Component Development',
        description: 'Generate complex UI components with a single prompt'
      },
      {
        title: 'API Integration',
        description: 'Automatically create API clients and data fetching logic'
      }
    ],
    cta: {
      title: 'Start Generating Code with AI',
      description: 'Join thousands of developers building faster with AI code generation'
    }
  },
  'rapid-prototyping': {
    slug: 'rapid-prototyping',
    title: 'Rapid Prototyping with AI - MVP in Minutes',
    heading: 'Build MVPs and Prototypes at Lightning Speed',
    description: 'Go from idea to working prototype in minutes, not days. Our AI-powered rapid prototyping platform helps you validate ideas faster than ever.',
    metaDescription: 'Create MVPs and prototypes in minutes with AI. Rapid prototyping for web apps, mobile apps, and SaaS products. Start building your idea today.',
    keywords: [
      'rapid prototyping',
      'MVP development',
      'quick prototype',
      'fast app development',
      'prototype builder',
      'AI prototyping',
      'startup MVP',
      'idea validation'
    ],
    features: [
      {
        title: 'Idea to Prototype',
        description: 'Transform your concept into a working prototype instantly',
        icon: '💡'
      },
      {
        title: 'Interactive Demos',
        description: 'Create clickable prototypes with real functionality',
        icon: '🎯'
      },
      {
        title: 'User Testing Ready',
        description: 'Share prototypes with users for immediate feedback',
        icon: '👥'
      },
      {
        title: 'Production Path',
        description: 'Easily convert prototypes into production applications',
        icon: '🚀'
      }
    ],
    benefits: [
      'Validate ideas before investing',
      'Get user feedback early',
      'Reduce time to market',
      'Lower development costs',
      'Iterate quickly',
      'Impress stakeholders'
    ],
    useCases: [
      {
        title: 'Startup MVPs',
        description: 'Build your minimum viable product to test market fit'
      },
      {
        title: 'Client Demos',
        description: 'Create impressive demos for client presentations'
      },
      {
        title: 'Hackathon Projects',
        description: 'Win hackathons with rapid prototype development'
      }
    ],
    cta: {
      title: 'Start Prototyping Today',
      description: 'Turn your ideas into reality with AI-powered rapid prototyping'
    }
  },
  'no-code-development': {
    slug: 'no-code-development',
    title: 'No-Code Development Platform - Build Without Coding',
    heading: 'Professional Apps Without Writing Code',
    description: 'Build sophisticated web applications without writing a single line of code. Our AI handles all the technical complexity for you.',
    metaDescription: 'Create professional web applications without coding. AI-powered no-code platform for building React, Vue, and Angular apps. Start building for free.',
    keywords: [
      'no-code development',
      'no-code platform',
      'visual development',
      'codeless app builder',
      'drag and drop builder',
      'no-code web apps',
      'citizen developer',
      'low-code platform'
    ],
    features: [
      {
        title: 'Natural Language Input',
        description: 'Describe your app in plain English - no coding required',
        icon: '🗣️'
      },
      {
        title: 'Visual Builder',
        description: 'See your app come to life with real-time visual feedback',
        icon: '🎨'
      },
      {
        title: 'Professional Output',
        description: 'Generate production-quality code behind the scenes',
        icon: '💼'
      },
      {
        title: 'Full Customization',
        description: 'Modify and extend your app without limits',
        icon: '🛠️'
      }
    ],
    benefits: [
      'No programming experience needed',
      'Professional results',
      'Faster than traditional development',
      'Lower development costs',
      'Easy maintenance',
      'Scalable applications'
    ],
    useCases: [
      {
        title: 'Business Applications',
        description: 'Build internal tools and business apps without IT'
      },
      {
        title: 'Landing Pages',
        description: 'Create marketing pages and campaigns quickly'
      },
      {
        title: 'SaaS Products',
        description: 'Launch your SaaS idea without technical barriers'
      }
    ],
    cta: {
      title: 'Build Without Code',
      description: 'Start creating professional applications without writing code'
    }
  },
  'enterprise-ai-development': {
    slug: 'enterprise-ai-development',
    title: 'Enterprise AI Development Platform - Scale with Confidence',
    heading: 'Enterprise-Grade AI Development Solutions',
    description: 'Build, deploy, and scale AI-powered applications with enterprise security, compliance, and support. Trusted by Fortune 500 companies.',
    metaDescription: 'Enterprise AI development platform with SOC2 compliance, dedicated support, and scalable infrastructure. Build secure AI applications for your organization.',
    keywords: [
      'enterprise AI development',
      'corporate AI platform',
      'enterprise software development',
      'AI for enterprises',
      'secure AI development',
      'compliance AI platform',
      'corporate development tools',
      'enterprise automation'
    ],
    features: [
      {
        title: 'Enterprise Security',
        description: 'SOC2 compliant with advanced security features',
        icon: '🔒'
      },
      {
        title: 'Team Collaboration',
        description: 'Built for teams with role-based access control',
        icon: '👥'
      },
      {
        title: 'Custom AI Models',
        description: 'Train AI on your codebase and standards',
        icon: '🧠'
      },
      {
        title: 'Dedicated Support',
        description: '24/7 enterprise support and SLAs',
        icon: '🛡️'
      }
    ],
    benefits: [
      'Enterprise-grade security',
      'Compliance ready',
      'Scalable infrastructure',
      'Custom integrations',
      'Priority support',
      'Training and onboarding'
    ],
    useCases: [
      {
        title: 'Digital Transformation',
        description: 'Accelerate your digital transformation initiatives'
      },
      {
        title: 'Legacy Modernization',
        description: 'Modernize legacy applications with AI assistance'
      },
      {
        title: 'Innovation Labs',
        description: 'Power your innovation labs with AI development'
      }
    ],
    cta: {
      title: 'Schedule Enterprise Demo',
      description: 'See how Zapdev can transform your enterprise development'
    }
  }
};

export const getSolution = memoize(
  (slug: string): SolutionData | undefined => {
    return solutions[slug];
  }
);

export const getAllSolutions = memoize(
  (): SolutionData[] => {
    return Object.values(solutions);
  }
);