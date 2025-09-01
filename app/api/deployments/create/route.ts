import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createId } from '@paralleldrive/cuid2';

interface DeploymentRequest {
  projectName: string;
  sandboxId: string;
  chatId?: string;
  framework?: string;
  environmentVars?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DeploymentRequest = await request.json();
    const { projectName, sandboxId, chatId, framework = 'nextjs', environmentVars = {} } = body;

    if (!projectName || !sandboxId) {
      return NextResponse.json({ 
        error: 'Project name and sandbox ID are required' 
      }, { status: 400 });
    }

    // Check user's deployment limit (free tier: 10 sites)
    const existingSites = await fetch('/api/deployments/list', {
      headers: { 'user-id': userId }
    });
    const sites = await existingSites.json();
    
    if (sites.length >= 10) {
      return NextResponse.json({ 
        error: 'Free tier limit reached. Maximum 10 deployed sites allowed.' 
      }, { status: 429 });
    }

    // Get sandbox files from E2B
    const filesResponse = await fetch('/api/get-sandbox-files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sandboxId })
    });

    if (!filesResponse.ok) {
      throw new Error('Failed to get sandbox files');
    }

    const { files } = await filesResponse.json();

    // Generate unique deployment ID and subdomain
    const siteId = createId();
    const subdomain = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${siteId.slice(0, 8)}`;

    // Deploy to Vercel using the API
    const vercelResponse = await deployToVercel({
      projectName: subdomain,
      files,
      framework,
      environmentVars: {
        ...environmentVars,
        // Add analytics tracking script
        NEXT_PUBLIC_ANALYTICS_ID: siteId,
        NEXT_PUBLIC_ANALYTICS_URL: `${process.env.NEXT_PUBLIC_APP_URL}/api/analytics/track`
      }
    });

    if (!vercelResponse.success) {
      throw new Error(`Vercel deployment failed: ${vercelResponse.error}`);
    }

    // Save deployment to database
    const deploymentData = {
      userId,
      siteId,
      name: projectName,
      url: `https://${subdomain}.vercel.app`,
      vercelDeploymentId: vercelResponse.deploymentId,
      status: 'building' as const,
      sandboxId,
      chatId,
      projectFiles: JSON.stringify(files),
      framework,
      nodeVersion: '18.x',
      lastDeployedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // TODO: Replace with actual Convex mutation call
    // This would normally be done in the component, but we need to save from API
    // For now, we'll use a direct API call to store in database

    return NextResponse.json({
      success: true,
      deployment: {
        siteId,
        name: projectName,
        url: `https://${subdomain}.vercel.app`,
        status: 'building',
        deploymentId: vercelResponse.deploymentId
      }
    });

  } catch (error) {
    console.error('[deployment] Failed to create deployment:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

async function deployToVercel({
  projectName,
  files,
  framework,
  environmentVars
}: {
  projectName: string;
  files: any[];
  framework: string;
  environmentVars: Record<string, string>;
}) {
  const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
  
  if (!VERCEL_API_TOKEN) {
    throw new Error('Vercel API token not configured');
  }

  // Transform files for Vercel deployment API
  const vercelFiles = files.reduce((acc: Record<string, string>, file) => {
    if (file.content && typeof file.content === 'string') {
      acc[file.path] = file.content;
    }
    return acc;
  }, {});

  // Add analytics injection to index.html or _app.tsx if it exists
  injectAnalyticsScript(vercelFiles, environmentVars.NEXT_PUBLIC_ANALYTICS_ID!);

  try {
    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName,
        files: vercelFiles,
        projectSettings: {
          framework,
          buildCommand: framework === 'nextjs' ? 'npm run build' : undefined,
          devCommand: framework === 'nextjs' ? 'npm run dev' : undefined,
          installCommand: 'npm install',
          outputDirectory: framework === 'nextjs' ? undefined : 'dist',
        },
        env: Object.entries(environmentVars).map(([key, value]) => ({
          key,
          value,
          type: 'encrypted'
        })),
        meta: {
          deployedFrom: 'zapdev',
          framework,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error: ${error}`);
    }

    const deployment = await response.json();
    
    return {
      success: true,
      deploymentId: deployment.id,
      url: deployment.url,
    };

  } catch (error) {
    console.error('[vercel] Deployment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function injectAnalyticsScript(files: Record<string, string>, analyticsId: string) {
  // Lightweight analytics script to inject
  const analyticsScript = `
    <script>
      (function() {
        const analyticsId = '${analyticsId}';
        const apiUrl = '${process.env.NEXT_PUBLIC_APP_URL}/api/analytics/track';
        
        function track(event, data = {}) {
          fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              siteId: analyticsId,
              event,
              page: window.location.pathname,
              title: document.title,
              referrer: document.referrer,
              timestamp: Date.now(),
              ...data
            })
          }).catch(() => {}); // Silent fail
        }
        
        // Track page view
        track('pageview');
        
        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', function() {
          const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
          if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            if (maxScroll % 25 === 0) { // Track at 25%, 50%, 75%, 100%
              track('scroll', { scrollDepth: maxScroll });
            }
          }
        });
        
        // Track page unload
        window.addEventListener('beforeunload', function() {
          track('pageunload', { scrollDepth: maxScroll });
        });
      })();
    </script>
  `;

  // Try to inject into index.html
  if (files['index.html']) {
    files['index.html'] = files['index.html'].replace(
      '</head>',
      `${analyticsScript}</head>`
    );
  }
  
  // Try to inject into _app.tsx for Next.js
  if (files['pages/_app.tsx']) {
    const script = `
import Script from 'next/script';

// Add this to your MyApp component's return statement before the Component
<Script strategy="afterInteractive">
  {\`${analyticsScript.replace(/`/g, '\\`')}\`}
</Script>
    `;
    // This would need more sophisticated injection logic for real implementation
  }
}