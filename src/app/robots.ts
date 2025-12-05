import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://zapdev.link';
  const allowPaths = ['/', '/ai-info', '/frameworks', '/solutions', '/showcase', '/pricing'];
  const disallowPaths = [
    '/api/',
    '/projects/',
    '/_next/',
    '/admin/',
    '*.json',
    '/monitoring',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: allowPaths,
        disallow: disallowPaths,
      },
      {
        userAgent: 'Googlebot',
        allow: allowPaths,
        disallow: disallowPaths,
      },
      {
        userAgent: 'Bingbot',
        allow: allowPaths,
        disallow: disallowPaths,
      },
      {
        userAgent: 'GPTBot',
        allow: allowPaths,
        disallow: ['/api/', '/projects/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: allowPaths,
        disallow: ['/api/', '/projects/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
