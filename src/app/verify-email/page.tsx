"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");
  
  const verifyEmail = useMutation(api.emailVerifications.verify);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. Please check your email for the correct link.");
      return;
    }

    verifyEmail({ token })
      .then(() => {
        setStatus("success");
        setMessage("Email verified successfully! Redirecting to dashboard...");
        setTimeout(() => router.push("/dashboard"), 2000);
      })
      .catch((error) => {
        setStatus("error");
        const errorMessage = error.message || "Verification failed";
        
        if (errorMessage.includes("expired")) {
          setMessage("This verification link has expired. Please request a new one.");
        } else if (errorMessage.includes("already verified")) {
          setMessage("This email is already verified. You can sign in to your account.");
        } else {
          setMessage("Invalid verification link. Please check your email or request a new link.");
        }
      });
  }, [token, verifyEmail, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin mb-4" />
              <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
              <p className="text-gray-600 dark:text-gray-400">Please wait while we confirm your email address.</p>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Email Verified!</h1>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </>
          )}
          
          {status === "error" && (
            <>
              <div className="bg-red-100 dark:bg-red-900/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Verification Failed</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => router.push("/sign-in")}
                  variant="outline"
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            </>
          )}
        </div>
        
        {status !== "verifying" && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Need help? <a href="mailto:support@zapdev.com" className="text-primary hover:underline">Contact Support</a>
          </p>
        )}
      </div>
    </div>
  );
}
