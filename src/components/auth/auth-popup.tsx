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

export const AuthPopup = () => {
  const router = useRouter();
  const { isOpen, mode, redirectUrl, close, setMode } = useAuthPopup();
  const isMountedRef = useRef<boolean>(false);

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
      }, 200);
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
        
        // Close and redirect after animation
        setTimeout(() => {
          close();
          router.push(redirectUrl);
          router.refresh();
        }, 800);
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
        
        // Close and redirect after animation
        setTimeout(() => {
          close();
          router.push(redirectUrl);
          router.refresh();
        }, 800);
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={signInLoading || googleLoading || githubLoading}
                    className="h-11"
                  >
                    {googleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGitHubSignIn}
                    disabled={signInLoading || googleLoading || githubLoading}
                    className="h-11"
                  >
                    {githubLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    )}
                    GitHub
                  </Button>
                </div>
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={signUpLoading || googleLoading || githubLoading}
                    className="h-11"
                  >
                    {googleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGitHubSignIn}
                    disabled={signUpLoading || googleLoading || githubLoading}
                    className="h-11"
                  >
                    {githubLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    )}
                    GitHub
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground pt-2">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
