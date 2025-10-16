"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ErrorPage({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          An unexpected error occurred. Our team has been notified and is working on it.
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className="text-left bg-muted p-4 rounded-lg mb-4 max-w-2xl">
            <summary className="cursor-pointer font-semibold mb-2">Error Details</summary>
            <pre className="text-sm overflow-x-auto">{error.message}</pre>
          </details>
        )}
      </div>

      <div className="flex gap-4 mb-12">
        <Button onClick={reset} size="lg">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            If the problem persists, try these options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="ghost" className="w-full justify-between">
            <Link href="/frameworks">
              Explore Frameworks
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-between">
            <Link href="/use-cases">
              View Use Cases
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-between">
            <Link href="/pricing">
              View Pricing
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
