import { NextRequest, NextResponse } from 'next/server';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export async function GET(request: NextRequest) {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const server = process.env.POLAR_SERVER || 'sandbox';

  errorLogger.info(ErrorCategory.API, 'Polar API test initiated', { server, hasToken: !!accessToken });

  if (!accessToken) {
    errorLogger.error(ErrorCategory.API, 'POLAR_ACCESS_TOKEN not configured');
    return NextResponse.json(
      {
        error: 'POLAR_ACCESS_TOKEN not configured',
        hint: 'Please set POLAR_ACCESS_TOKEN in your .env.local file',
      },
      { status: 500 }
    );
  }

  try {
    // Test the Polar API connection
    const response = await fetch(
      `https://${server === 'production' ? 'api.polar.sh' : 'sandbox-api.polar.sh'}/v1/organizations`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      errorLogger.error(ErrorCategory.API, `Polar API connection failed with status ${response.status}`);
      return NextResponse.json(
        {
          error: 'Failed to connect to Polar API',
          status: response.status,
          hint: 'Check your POLAR_ACCESS_TOKEN is valid and has proper permissions',
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    errorLogger.info(ErrorCategory.API, `Polar API test successful - found ${data.items?.length || 0} organizations`);

    return NextResponse.json({
      success: true,
      message: 'Polar API connection successful',
      server,
      organizations: data.items?.length || 0,
      config: {
        accessToken: accessToken.substring(0, 10) + '...',
        server,
        basicProductId: process.env.POLAR_BASIC_PRODUCT_ID || 'not set',
        proProductId: process.env.POLAR_PRO_PRODUCT_ID || 'not set',
        enterpriseProductId: process.env.POLAR_ENTERPRISE_PRODUCT_ID || 'not set',
      },
    });
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Polar API test failed:', error);
    return NextResponse.json(
      {
        error: 'Error testing Polar API',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check your network connection and Polar API credentials',
      },
      { status: 500 }
    );
  }
}
