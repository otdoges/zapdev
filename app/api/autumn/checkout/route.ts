import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { autumn } from '@/convex/autumn';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth(request);
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await request.json().catch(() => ({ priceId: undefined }));

    const mockCtx = { auth: { getUserIdentity: () => ({ subject: auth.userId, name: '', email: '' }) } } as any;

    if (process.env.AUTUMN_SECRET_KEY) {
      try {
        const result: any = await autumn.checkout(mockCtx, { priceId });
        const url = result?.url || result?.sessionUrl || result?.redirectUrl;
        if (url) {
          return NextResponse.json({ url });
        }
      } catch (e) {
        // fall through to Stripe
      }
    }

    // Fallback to Stripe
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const stripeRes = await fetch(`${origin}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: priceId || process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
        mode: 'subscription'
      })
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.text();
      return NextResponse.json({ error: err || 'Failed to create checkout session' }, { status: 500 });
    }

    const { sessionId } = await stripeRes.json();
    return NextResponse.json({ provider: 'stripe', sessionId });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
