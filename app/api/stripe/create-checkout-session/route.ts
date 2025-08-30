import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe';
import { z } from 'zod';

const checkoutSessionSchema = z.object({
  priceId: z.string().optional(),
  mode: z.enum(['payment', 'subscription']).default('payment'),
  quantity: z.number().int().positive().default(1),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
  allowPromotionCodes: z.boolean().default(true),
  customAmount: z.object({
    amount: z.number().int().positive(),
    currency: z.string().length(3).toLowerCase(),
    name: z.string(),
    description: z.string().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = checkoutSessionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { 
      priceId, 
      mode, 
      quantity, 
      successUrl, 
      cancelUrl, 
      allowPromotionCodes,
      customAmount 
    } = validation.data;

    if (!priceId && !customAmount) {
      return NextResponse.json(
        { error: 'Either priceId or customAmount is required' },
        { status: 400 }
      );
    }

    // Get the origin URL for redirects
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(userId, '', ''); // Email will be collected by Stripe

    // Build line items
    let lineItems;
    if (priceId) {
      lineItems = [{
        price: priceId,
        quantity,
      }];
    } else if (customAmount) {
      lineItems = [{
        price_data: {
          currency: customAmount.currency,
          product_data: {
            name: customAmount.name,
            description: customAmount.description,
          },
          unit_amount: customAmount.amount,
          ...(mode === 'subscription' && {
            recurring: {
              interval: 'month',
            },
          }),
        },
        quantity,
      }];
    }

    const sessionParams = {
      customer: customer.id,
      payment_method_types: ['card'] as const,
      line_items: lineItems,
      mode,
      allow_promotion_codes: allowPromotionCodes,
      success_url: successUrl || `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/billing/canceled`,
      metadata: {
        userId,
      },
      ...(mode === 'subscription' && {
        subscription_data: {
          metadata: {
            userId,
          },
        },
      }),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Stripe checkout session creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}