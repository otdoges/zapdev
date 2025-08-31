import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const clerkDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;

    // Check if values are placeholders
    const isConvexConfigured = convexUrl && !convexUrl.includes('your_convex_url') && !convexUrl.includes('your-convex-url');
    const isClerkDomainConfigured = clerkDomain && !clerkDomain.includes('your_clerk_subdomain') && !clerkDomain.includes('your-clerk-subdomain');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      convex: {
        url: convexUrl ? (isConvexConfigured ? 'Configured' : 'Placeholder detected') : 'Missing',
        configured: isConvexConfigured,
        urlPattern: convexUrl ? (convexUrl.startsWith('https://') && convexUrl.endsWith('.convex.cloud')) : false
      },
      clerk: {
        domain: clerkDomain ? (isClerkDomainConfigured ? 'Configured' : 'Placeholder detected') : 'Missing',
        publishableKey: clerkPublishableKey ? 'Present' : 'Missing',
        secretKey: clerkSecretKey ? 'Present' : 'Missing',
        domainConfigured: isClerkDomainConfigured
      },
      issues: [] as string[],
      recommendations: [] as string[]
    };

    // Identify issues
    if (!isConvexConfigured) {
      diagnostics.issues.push('Convex URL is missing or contains placeholder values');
      diagnostics.recommendations.push('1. Go to https://dashboard.convex.dev and create a project');
      diagnostics.recommendations.push('2. Copy your project URL (e.g., https://pleasant-walrus-123.convex.cloud)');
      diagnostics.recommendations.push('3. Update NEXT_PUBLIC_CONVEX_URL in .env.local');
    }

    if (!isClerkDomainConfigured) {
      diagnostics.issues.push('Clerk JWT issuer domain contains placeholder values');
      diagnostics.recommendations.push('4. Update CLERK_JWT_ISSUER_DOMAIN with your actual Clerk domain');
    }

    if (!clerkPublishableKey) {
      diagnostics.issues.push('Clerk publishable key is missing');
      diagnostics.recommendations.push('5. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY from Clerk dashboard');
    }

    if (!clerkSecretKey) {
      diagnostics.issues.push('Clerk secret key is missing');
      diagnostics.recommendations.push('6. Add CLERK_SECRET_KEY from Clerk dashboard');
    }

    const status = diagnostics.issues.length === 0 ? 'healthy' : 'needs_configuration';

    return NextResponse.json({
      status,
      message: status === 'healthy' 
        ? 'All configurations look good!' 
        : 'Configuration issues detected. Chat creation will fail.',
      diagnostics
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to run diagnostics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}