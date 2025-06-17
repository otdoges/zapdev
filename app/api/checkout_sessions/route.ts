import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripeClient } from '../../../lib/stripe';

export async function POST() {
  try {
    const headersList = await headers();
    const origin = headersList.get('origin');
    const stripe = await getStripeClient();

    const priceId = process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      console.error('STRIPE_PRICE_ID environment variable is not set.');
      return NextResponse.json(
        { error: 'Server configuration error: Price ID is missing.' },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=true`,
    });

    if (!session.url) {
      console.error('Stripe session URL is null.');
      return NextResponse.json(
        { error: 'Failed to create Stripe session: No redirect URL provided.' },
        { status: 500 }
      );
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (err: any) {
    console.error('Stripe API error:', err.message);
    const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
    return NextResponse.json(
      { error: err.message || 'An unknown error occurred' },
      { status: statusCode }
    );
  }
}
