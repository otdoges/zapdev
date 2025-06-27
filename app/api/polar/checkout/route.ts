import { Checkout } from '@polar-sh/nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/success`;

  if (!accessToken) {
    console.error('POLAR_ACCESS_TOKEN is not configured');
    return NextResponse.json(
      { error: 'Payment system not configured. Please contact support.' },
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
    console.error('Polar checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
