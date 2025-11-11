"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import { useAuthPopup } from "@/lib/auth-popup-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AUTH_TIMING } from "@/lib/constants";
import { OAuthButtons } from "./oauth-buttons";

export const AuthPopup = () => {
  const router = useRouter();
  const { isOpen, mode, redirectUrl, close, setMode } = useAuthPopup();
  const isMountedRef = useRef<boolean>(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);

  // Sign Up form state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);

  // OAuth loading states
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all forms after close animation
      setTimeout(() => {
        setSignInEmail("");
        setSignInPassword("");
        setSignUpName("");
        setSignUpEmail("");
        setSignUpPassword("");
        setShowSuccess(false);
      }, AUTH_TIMING.POPUP_RESET_DELAY);
    }
  }, [isOpen]);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMountedRef.current) return;

    setSignInLoading(true);

    try {
      const result = await signIn.email({
        email: signInEmail,
        password: signInPassword,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to sign in");
      } else {
        // Show success animation
        setShowSuccess(true);

        // Clear any existing redirect timeout
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }

        // Close and redirect after animation
        redirectTimeoutRef.current = setTimeout(() => {
          redirectTimeoutRef.current = null;
          close();
          router.push(redirectUrl);
          router.refresh();
        }, AUTH_TIMING.SUCCESS_REDIRECT_DELAY);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      if (isMountedRef.current) {
        setSignInLoading(false);
      }
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMountedRef.current) return;

    setSignUpLoading(true);

    try {
      const result = await signUp.email({
        email: signUpEmail,
        password: signUpPassword,
        name: signUpName,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to sign up");
      } else {
        // Show success animation
        setShowSuccess(true);

        // Clear any existing redirect timeout
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }

        // Close and redirect after animation
        redirectTimeoutRef.current = setTimeout(() => {
          redirectTimeoutRef.current = null;
          close();
          router.push(redirectUrl);
          router.refresh();
        }, AUTH_TIMING.SUCCESS_REDIRECT_DELAY);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      if (isMountedRef.current) {
        setSignUpLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signIn.social({
        provider: "google",
        callbackURL: redirectUrl,
      });
    } catch (err) {
      toast.error("Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      setGithubLoading(true);
      await signIn.social({
        provider: "github",
        callbackURL: redirectUrl,
      });
    } catch (err) {
      toast.error("Failed to sign in with GitHub");
      setGithubLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {showSuccess ? (
          // Success animation
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="animate-in zoom-in-95 duration-300">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Success!</h3>
            <p className="text-sm text-muted-foreground">Redirecting...</p>
          </div>
        ) : (
          <>
            {/* Header with logo */}
            <div className="flex flex-col items-center pt-8 pb-4 px-6">
              <Image 
                src="/logo.svg"
                alt="ZapDev"
                width={48}
                height={48}
                className="mb-3"
              />
              <DialogHeader className="text-center space-y-1">
                <DialogTitle className="text-2xl font-bold">
                  {mode === "sign-in" ? "Welcome back" : "Create account"}
                </DialogTitle>
                <DialogDescription>
                  {mode === "sign-in" 
                    ? "Sign in to continue to ZapDev" 
                    : "Get started with ZapDev for free"
                  }
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Tabs */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as "sign-in" | "sign-up")} className="w-full">
              <div className="px-6 pb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sign-in">Sign In</TabsTrigger>
                  <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
                </TabsList>
              </div>

              {/* Sign In Tab */}
              <TabsContent value="sign-in" className="mt-0 px-6 pb-6 space-y-4">
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                      disabled={signInLoading}
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                      disabled={signInLoading}
                      className="h-11"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11"
                    disabled={signInLoading}
                  >
                    {signInLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                <OAuthButtons
                  onGoogleClick={handleGoogleSignIn}
                  onGitHubClick={handleGitHubSignIn}
                  googleLoading={googleLoading}
                  githubLoading={githubLoading}
                  disabled={signInLoading}
                />
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="sign-up" className="mt-0 px-6 pb-6 space-y-4">
                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      required
                      disabled={signUpLoading}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      disabled={signUpLoading}
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={signUpLoading}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11"
                    disabled={signUpLoading}
                  >
                    {signUpLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </Button>
                </form>

                <OAuthButtons
                  onGoogleClick={handleGoogleSignIn}
                  onGitHubClick={handleGitHubSignIn}
                  googleLoading={googleLoading}
                  githubLoading={githubLoading}
                  disabled={signUpLoading}
                />

                <p className="text-xs text-center text-muted-foreground pt-2">
                  By signing up, you agree to our{" "}
                  <a
                    href="https://zapdev.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-center text-muted-foreground"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://zapdev.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-center text-muted-foreground"
                  >
                    Privacy Policy
                  </a>
                </p>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
