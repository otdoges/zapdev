import { redirect } from 'next/navigation';
import polar from '@/lib/polar';
import Link from 'next/link';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

// Define the expected shape of searchParams for type safety
interface SuccessPageProps {
  searchParams: {
    session_id?: string;
    checkout_id?: string;
  };
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const sessionId = searchParams.session_id;
  const checkoutId = searchParams.checkout_id;

  // Support both Polar (checkout_id) and legacy Stripe (session_id) for backward compatibility
  const paymentId = checkoutId || sessionId;

  if (!paymentId) {
    errorLogger.error(
      ErrorCategory.GENERAL,
      'Missing checkout_id or session_id in success page query parameters.'
    );
    return redirect('/?error=missing_payment_id');
  }

  try {
    // Handle Polar checkout
    if (checkoutId && polar) {
      const checkout = await polar.checkouts.get(checkoutId);
      const customerEmail = checkout.customer_email || 'your email address';

      if (checkout.status === 'confirmed') {
        return (
          <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0D0D10] via-[#1a1a20] to-[#0D0D10]">
            <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
              <div className="mb-4 text-6xl">🎉</div>
              <h1 className="mb-4 text-3xl font-bold text-white">Welcome to ZapDev Pro!</h1>
              <p className="text-lg leading-relaxed text-gray-300">
                Thank you for subscribing! A confirmation email has been sent to{' '}
                <strong className="text-[#6C52A0]">{customerEmail}</strong>.
              </p>
              <p className="text-sm text-gray-400">
                You now have access to all Pro features. If you have any questions, please email{' '}
                <a
                  href="mailto:support@zapdev.ai"
                  className="text-[#6C52A0] transition-colors hover:text-[#7C62B0]"
                >
                  support@zapdev.ai
                </a>
                .
              </p>

              <div className="flex flex-col gap-4 pt-6 sm:flex-row">
                <Link
                  href="/chat"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#6C52A0] to-[#A0527C] px-6 py-3 font-medium text-white transition-all hover:from-[#7C62B0] hover:to-[#B0627C]"
                >
                  Start Building →
                </Link>
                <Link
                  href="/api/polar/portal"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-[#6C52A0] px-6 py-3 font-medium text-[#6C52A0] transition-all hover:bg-[#6C52A0] hover:text-white"
                >
                  Manage Subscription
                </Link>
              </div>
            </div>
          </div>
        );
      }

      // Other checkout statuses
      errorLogger.warning(
        ErrorCategory.GENERAL,
        `Polar checkout ${checkoutId} has status: ${checkout.status}. Redirecting to home.`
      );
      return redirect('/?error=payment_not_completed');
    }

    // Fallback to legacy Stripe handling if no Polar checkout
    if (sessionId) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0D0D10] text-white">
          <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
            <h1 className="mb-4 text-2xl font-bold">Payment Processing</h1>
            <p className="mb-6 text-gray-400">
              We're updating our payment system. Please check your subscription status.
            </p>
            <Link
              href="/"
              className="inline-block rounded-lg bg-gradient-to-r from-[#6C52A0] to-[#A0527C] px-6 py-3 font-medium text-white transition-all hover:from-[#7C62B0] hover:to-[#B0627C]"
            >
              Return to Home
            </Link>
          </div>
        </div>
      );
    }

    return redirect('/?error=payment_not_completed');
  } catch (error: any) {
    errorLogger.error(
      ErrorCategory.GENERAL,
      `Error retrieving payment session ${paymentId}:`,
      error.message
    );

    // Graceful fallback on error
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D10] text-white">
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
          <h1 className="mb-4 text-2xl font-bold">Thank You!</h1>
          <p className="mb-6 text-gray-400">Your payment has been processed successfully.</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-gradient-to-r from-[#6C52A0] to-[#A0527C] px-6 py-3 font-medium text-white transition-all hover:from-[#7C62B0] hover:to-[#B0627C]"
          >
            Start Building →
          </Link>
        </div>
      </div>
    );
  }
}
