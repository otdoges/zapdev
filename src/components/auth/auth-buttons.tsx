import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Github, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function SocialAuthButtons() {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleSignIn = async (provider: "github" | "google") => {
        setIsLoading(provider);
        try {
            await authClient.signIn.social({
                provider,
                callbackURL: "/dashboard",
            });
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
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
                    <img src="/github.svg" alt="GitHub" className="mr-2 h-4 w-4" />
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
                    <img src="/google.svg" alt="Google" className="mr-2 h-4 w-4" />
                )}
                Continue with Google
            </Button>
        </div>
    );
}
