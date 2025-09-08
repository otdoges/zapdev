import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { autumn } from '@/convex/autumn';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth(request);
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { returnUrl } = await request.json().catch(() => ({ returnUrl: undefined }));
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (process.env.AUTUMN_SECRET_KEY) {
      try {
        const mockCtx = { auth: { getUserIdentity: () => ({ subject: auth.userId, name: '', email: '' }) } } as any;
        const result: any = await autumn.billingPortal(mockCtx, { returnUrl: returnUrl || `${origin}/pricing` });
        const url = result?.url || result?.portalUrl || result?.redirectUrl;
        if (url) {
          return NextResponse.json({ url });
        }
      } catch (e) {
        // fall through to Stripe
      }
    }

    // Fallback to Stripe portal
    const stripeRes = await fetch(`${origin}/api/stripe/customer-portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnUrl: returnUrl || `${origin}/pricing` })
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.text();
      return NextResponse.json({ error: err || 'Failed to create portal session' }, { status: 500 });
    }

    const data = await stripeRes.json();
    return NextResponse.json({ url: data.url });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
