import { redirect } from 'next/navigation';
import { getStripeClient } from '../../lib/stripe'; // Adjusted path
import Link from 'next/link';

// Define the expected shape of searchParams for type safety
interface SuccessPageProps {
  searchParams: {
    session_id?: string;
  };
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const sessionId = searchParams.session_id;
  const stripe = getStripeClient();

  if (!sessionId) {
    console.error('Missing session_id in success page query parameters.');
    // Optionally, redirect to an error page or home with a message
    return redirect('/?error=missing_session_id');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent', 'customer'],
    });

    // Safely access customer email
    const customerEmail = session.customer_details?.email || 
                          (session.customer && typeof session.customer === 'object' && 'email' in session.customer ? session.customer.email : null) || 
                          'your email address';

    if (session.status === 'open') {
      // This session is still active, perhaps the user navigated back.
      // Redirecting to home or the cart page might be appropriate.
      console.warn(`Stripe session ${sessionId} is still open. Redirecting to home.`);
      return redirect('/');
    }

    if (session.status === 'complete') {
      return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '40px', textAlign: 'center', backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h1 style={{ color: '#333', fontSize: '24px', marginBottom: '20px' }}>Payment Successful!</h1>
            <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.6' }}>
              We appreciate your business! A confirmation email has been sent to{' '}
              <strong style={{ color: '#007bff' }}>{customerEmail}</strong>.
            </p>
            <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.6', marginTop: '10px' }}>
              If you have any questions, please email{' '}
              <a href="mailto:orders@example.com" style={{ color: '#007bff', textDecoration: 'none' }}>
                orders@example.com
              </a>.
            </p>
            <Link href="/" style={{ display: 'inline-block', marginTop: '30px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
              Return to Homepage
            </Link>
          </div>
        </div>
      );
    }

    // Fallback for other statuses or if status is not 'complete' or 'open'
    console.warn(`Stripe session ${sessionId} has status: ${session.status}. Redirecting to home with error.`);
    return redirect('/?error=payment_not_completed');

  } catch (error: any) {
    console.error(`Error retrieving Stripe session ${sessionId}:`, error.message);
    // Redirect to an error page or home with a generic error message
    return redirect('/?error=session_retrieval_failed');
  }
}