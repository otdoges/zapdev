"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function VerificationWarning() {
    const { data: session } = authClient.useSession();
    const [isLoading, setIsLoading] = useState(false);

    if (!session?.user || session.user.emailVerified) {
        return null;
    }

    const handleResend = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await authClient.sendVerificationEmail({
                email: session.user.email,
                callbackURL: "/dashboard", // Or wherever we want them to land
            });

            if (error) {
                console.error('Auth error:', error);
                toast.error(error.message || 'Failed to send verification email.');
                return;
            }

            toast.success("Verification email sent!");
        } catch (error) {
            console.error('Auth error:', error);
            toast.error('Failed to send verification email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0 sticky top-0 z-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Email Verification Required</AlertTitle>
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
                <span>
                    Your email address <strong>{session.user.email}</strong> is not verified.
                    Some features may be restricted.
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="bg-background text-foreground hover:bg-accent"
                >
                    {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    Resend Verification Email
                </Button>
            </AlertDescription>
        </Alert>
    );
}
