"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const trimmedEmail = email.trim();
            const result = forgotPasswordSchema.safeParse({ email: trimmedEmail });
            if (!result.success) {
                toast.error(result.error.issues[0].message);
                setIsLoading(false);
                return;
            }

            const { data, error } = await authClient.forgetPassword({
                email: trimmedEmail,
                redirectTo: "/reset-password",
            });

            if (error) {
                console.error('Auth error:', error);
                toast.error(error.message || 'Failed to send reset email. Please try again.');
                return;
            }

            setIsSubmitted(true);
            toast.success("Password reset email sent!");
        } catch (error) {
            console.error('Auth error:', error);
            const message = error instanceof Error
                ? error.message
                : 'Failed to send reset email. Please try again.';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="text-center space-y-4">
                <h3 className="text-lg font-medium">Check your email</h3>
                <p className="text-muted-foreground">
                    We have sent a password reset link to <strong>{email}</strong>.
                </p>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsSubmitted(false)}
                >
                    Try another email
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
            </Button>
        </form>
    );
}
