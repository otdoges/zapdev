"use client";

import { Button } from "@/components/ui/button";
import { useStackApp } from "@stackframe/stack";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

export function SocialAuthButtons() {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const stackApp = useStackApp();

    const handleSignIn = async (provider: "github" | "google") => {
        setIsLoading(provider);
        try {
            await stackApp.signInWithOAuth(provider);
        } catch (error) {
            console.error("Social sign-in error:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="grid gap-2">
            <Button
                variant="outline"
                type="button"
                disabled={!!isLoading}
                onClick={() => handleSignIn("github")}
                className="w-full"
            >
                {isLoading === "github" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Image src="/github.svg" alt="GitHub" width={16} height={16} className="mr-2 h-4 w-4" />
                )}
                Continue with GitHub
            </Button>
            <Button
                variant="outline"
                type="button"
                disabled={!!isLoading}
                onClick={() => handleSignIn("google")}
                className="w-full"
            >
                {isLoading === "google" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Image src="/google.svg" alt="Google" width={16} height={16} className="mr-2 h-4 w-4" />
                )}
                Continue with Google
            </Button>
        </div>
    );
}
