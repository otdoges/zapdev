import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAllFrameworks } from '@/lib/frameworks';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://zapdev.link';
  
  try {
    const [projects, frameworks] = await Promise.all([
      prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          Message: {
            where: {
              Fragment: {
                isNot: null
              }
            },
            take: 1
          }
        }
      }),
      Promise.resolve(getAllFrameworks())
    ]);

    const rssItems = [
      // Framework pages
      ...frameworks.map(framework => ({
        title: `${framework.name} Development with AI - Build Apps Faster`,
        description: framework.metaDescription,
        link: `${baseUrl}/frameworks/${framework.slug}`,
        pubDate: new Date().toUTCString(),
        category: 'Frameworks'
      })),
      // Recent projects
      ...projects.map(project => ({
        title: escapeXml(project.name),
        description: `Check out ${escapeXml(project.name)}, a ${project.framework} project built with Zapdev AI`,
        link: `${baseUrl}/projects/${project.id}`,
        pubDate: project.createdAt.toUTCString(),
        category: 'Projects'
      }))
    ];

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Zapdev - AI-Powered Development Platform</title>
    <description>Latest updates, projects, and framework guides from Zapdev</description>
    <link>${baseUrl}</link>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${rssItems.map(item => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <description>${escapeXml(item.description)}</description>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <category>${item.category}</category>
    </item>`).join('')}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=7200'
      }
    });
  } catch (error) {
    console.error('RSS generation error:', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}