import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  structuredData?: Record<string, any>;
  noindex?: boolean;
  nofollow?: boolean;
  robots?: string;
  language?: string;
  alternateLanguages?: Record<string, string>;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  articleSection?: string;
  articleTags?: string[];
}

const defaultSEO = {
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
    'startup tools'
  ],
  author: 'ZapDev',
  ogType: 'website' as const,
  twitterCard: 'summary_large_image' as const,
  language: 'en',
  robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
};

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  author,
  canonical,
  ogImage = '/og-image.svg',
  ogType,
  twitterCard,
  structuredData,
  noindex = false,
  nofollow = false,
  robots,
  language,
  alternateLanguages,
  articlePublishedTime,
  articleModifiedTime,
  articleAuthor,
  articleSection,
  articleTags = []
}) => {
  const finalTitle = title ? `${title} | ZapDev` : defaultSEO.title;
  const finalDescription = description || defaultSEO.description;
  const finalKeywords = [...defaultSEO.keywords, ...keywords].join(', ');
  const finalAuthor = author || defaultSEO.author;
  const finalOgType = ogType || defaultSEO.ogType;
  const finalTwitterCard = twitterCard || defaultSEO.twitterCard;
  const finalLanguage = language || defaultSEO.language;
  const finalRobots = noindex || nofollow 
    ? `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`
    : robots || defaultSEO.robots;

  const baseUrl = 'https://zapdev.com';
  const finalCanonical = canonical ? `${baseUrl}${canonical}` : baseUrl;
  const finalOgImage = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;

  useEffect(() => {
    // Update document title for better UX
    document.title = finalTitle;
    
    // Update meta description for dynamic content
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', finalDescription);
    }
    
    // Update canonical link
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', finalCanonical);
    }
  }, [finalTitle, finalDescription, finalCanonical]);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content={finalAuthor} />
      <meta name="robots" content={finalRobots} />
      <meta name="language" content={finalLanguage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={finalCanonical} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content={finalOgType} />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={finalTitle} />
      <meta property="og:site_name" content="ZapDev" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={finalTwitterCard} />
      <meta name="twitter:site" content="@zapdev" />
      <meta name="twitter:creator" content="@zapdev" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalOgImage} />
      <meta name="twitter:image:alt" content={finalTitle} />
      
      {/* Article-specific meta tags */}
      {ogType === 'article' && (
        <>
          {articlePublishedTime && (
            <meta property="article:published_time" content={articlePublishedTime} />
          )}
          {articleModifiedTime && (
            <meta property="article:modified_time" content={articleModifiedTime} />
          )}
          {articleAuthor && (
            <meta property="article:author" content={articleAuthor} />
          )}
          {articleSection && (
            <meta property="article:section" content={articleSection} />
          )}
          {articleTags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Alternate languages */}
      {alternateLanguages && Object.entries(alternateLanguages).map(([lang, url]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Additional SEO meta tags */}
      <meta name="googlebot" content={finalRobots} />
      <meta name="bingbot" content={finalRobots} />
      <meta name="msapplication-TileColor" content="#0ea5e9" />
      <meta name="theme-color" content="#0ea5e9" />
      <meta name="color-scheme" content="light dark" />
      
      {/* Preconnect for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://cdn.gpteng.co" />
      
      {/* DNS prefetch for external resources */}
      <link rel="dns-prefetch" href="https://cdn.gpteng.co" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
    </Helmet>
  );
};

// Predefined SEO configurations for common page types
export const SEOPresets = {
  home: {
    title: 'AI-Powered Development Platform',
    description: 'Build full-stack web applications, MVPs, and SaaS products with AI code generation, real-time collaboration, and instant deployment.',
    keywords: ['AI development', 'full-stack development', 'code generation', 'web app builder'],
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'ZapDev',
      'url': 'https://zapdev.com',
      'description': 'AI-powered development platform for building full-stack web applications'
    }
  },
  
  pricing: {
    title: 'Pricing Plans',
    description: 'Choose the perfect ZapDev plan for your development needs. Free tier available with premium features for startups, developers, and enterprises.',
    keywords: ['pricing', 'plans', 'subscription', 'features', 'cost'],
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': 'ZapDev Platform',
      'description': 'AI-powered development platform with multiple pricing tiers',
      'offers': {
        '@type': 'AggregateOffer',
        'priceCurrency': 'USD',
        'availability': 'https://schema.org/InStock'
      }
    }
  },
  
  features: {
    title: 'Features & Capabilities',
    description: 'Explore ZapDev\'s powerful features including AI code generation, real-time collaboration, instant deployment, and comprehensive development tools.',
    keywords: ['features', 'capabilities', 'AI code generation', 'collaboration', 'deployment'],
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'ZapDev',
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Web'
    }
  },
  
  blog: {
    title: 'Development Blog & Insights',
    description: 'Stay updated with the latest in AI development, coding tutorials, industry insights, and ZapDev platform updates.',
    keywords: ['blog', 'tutorials', 'insights', 'development', 'AI', 'coding'],
    ogType: 'article' as const,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      'name': 'ZapDev Blog',
      'description': 'Development insights and tutorials from the ZapDev team'
    }
  },
  
  docs: {
    title: 'Documentation & Guides',
    description: 'Comprehensive documentation, tutorials, and guides to help you get the most out of ZapDev\'s AI-powered development platform.',
    keywords: ['documentation', 'guides', 'tutorials', 'help', 'API', 'integration'],
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      'name': 'ZapDev Documentation',
      'description': 'Comprehensive guides and tutorials for ZapDev platform'
    }
  }
};

export default SEO;
