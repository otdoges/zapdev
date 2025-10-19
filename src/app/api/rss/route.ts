export async function GET() {
  const baseUrl = 'https://zapdev.link';

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Zapdev - AI-Powered Development Platform</title>
    <link>${baseUrl}</link>
    <description>Build production-ready web applications with AI assistance. Support for React, Vue, Angular, Svelte, and Next.js.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml"/>
    
    <item>
      <title>Welcome to Zapdev</title>
      <link>${baseUrl}</link>
      <guid>${baseUrl}</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>Build production-ready web applications with AI assistance. Support for React, Vue, Angular, Svelte, and Next.js. Build, test, and deploy in minutes, not days.</description>
      <content:encoded><![CDATA[
        <p>Zapdev is an AI-powered development platform that helps you build web applications 10x faster.</p>
        <p>Features:</p>
        <ul>
          <li>Multi-Framework Support (React, Vue, Angular, Svelte, Next.js)</li>
          <li>AI Code Generation</li>
          <li>Instant Deployment</li>
          <li>Real-time Collaboration</li>
          <li>Version Control Integration</li>
        </ul>
      ]]></content:encoded>
    </item>

    <item>
      <title>Frameworks - Choose Your Technology</title>
      <link>${baseUrl}/frameworks</link>
      <guid>${baseUrl}/frameworks</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>Build applications with React, Vue, Angular, Svelte, and Next.js using AI assistance. Compare frameworks and choose the best for your project.</description>
    </item>

    <item>
      <title>Solutions - AI Development for Everyone</title>
      <link>${baseUrl}/solutions</link>
      <guid>${baseUrl}/solutions</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>Explore our AI-powered development solutions. From code generation to rapid prototyping, find the perfect solution for your development needs.</description>
    </item>

    <item>
      <title>Pricing - Start Building Today</title>
      <link>${baseUrl}/home/pricing</link>
      <guid>${baseUrl}/home/pricing</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>Choose the perfect plan for your development needs. Start free with Zapdev and scale as you grow. Transparent pricing for individuals and teams.</description>
    </item>
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
