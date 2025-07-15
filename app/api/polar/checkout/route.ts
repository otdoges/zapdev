import { Checkout } from '@polar-sh/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import polar from '@/lib/polar';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';
import { createClient } from '@/lib/supabase-server';

// Handle both GET (Polar redirect) and POST (manual checkout creation)
export async function GET(request: NextRequest) {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/success`;

  if (!accessToken) {
    errorLogger.error(ErrorCategory.API, 'POLAR_ACCESS_TOKEN is not configured');
    return NextResponse.json(
      { error: 'Payment system not configured. Please contact support.' },
      { status: 500 }
    );
  }

  if (!successUrl || successUrl === 'undefined/success') {
    errorLogger.error(ErrorCategory.API, 'NEXT_PUBLIC_SITE_URL is not configured');
    return NextResponse.json(
      { error: 'Application not properly configured. Please contact support.' },
      { status: 500 }
    );
  }

  try {
    const checkoutHandler = Checkout({
      accessToken,
      successUrl,
    });
    return await checkoutHandler(request);
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Polar checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    if (!polar) {
      errorLogger.error(ErrorCategory.API, 'Polar client not initialized');
      return NextResponse.json({ error: 'Payment system not available' }, { status: 500 });
    }

    // Get current user for customer info
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Create checkout session with Polar SDK
    const checkout = await polar.checkouts.create({
      price_id: priceId,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
      customer_email: user.email,
    });

    errorLogger.info(ErrorCategory.API, `Created Polar checkout session: ${checkout.id}`);

    return NextResponse.json({
      url: checkout.url,
      checkout_id: checkout.id,
    });
  } catch (error: any) {
    errorLogger.error(ErrorCategory.API, 'Failed to create checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
