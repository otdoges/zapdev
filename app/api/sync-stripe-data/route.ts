import { NextRequest, NextResponse } from 'next/server';

// Placeholder route – to be implemented
export async function POST(_req: NextRequest) {
  return NextResponse.json({ error: 'Sync Stripe data endpoint not implemented.' }, { status: 501 });
}
