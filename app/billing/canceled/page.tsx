'use client';

import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function CanceledPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[20px] p-8 shadow-sm border border-gray-200 text-center">
          <div className="mb-6">
            <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Canceled
            </h1>
            <p className="text-gray-600">
              Your payment was canceled. No charges have been made to your account.
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-orange-900 mb-2">What happened?</h3>
            <p className="text-sm text-orange-800">
              You closed the payment window or clicked the back button during the checkout process. 
              Your subscription has not been activated.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            <Button asChild className="w-full">
              <Link href="/billing">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/billing">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Billing
              </Link>
            </Button>
          </div>

          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Need assistance?</h4>
              <p className="text-xs">
                If you're experiencing issues with payment, please contact our support team. 
                We're here to help!
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Payment Security</h4>
              <p className="text-xs">
                All payments are processed securely through Stripe. Your payment information 
                is encrypted and never stored on our servers.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              You can continue using the free tier while you decide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}