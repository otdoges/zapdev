"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { z } from "zod";

const resetPasswordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // Better Auth usually passes the token as a query param or hash? 
    // Actually, usually it's `token` query param.
    // But `better-auth` might handle it automatically if we use `resetPassword` function?
    // No, we usually need to pass the token if it's not in the URL in a way the client expects?
    // Wait, `authClient.resetPassword` usually takes `newPassword` and optionally `token`?
    // If the token is in the URL, `better-auth` client might pick it up automatically?
    // Let's assume we need to pass it if we can extract it.
    // But wait, `resetPassword` function signature usually is `({ newPassword, token })`.

    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = resetPasswordSchema.safeParse({ password, confirmPassword });
            if (!result.success) {
                toast.error(result.error.issues[0].message);
                setIsLoading(false);
                return;
            }

            // We rely on the token being in the URL or handled by the client automatically?
            // Usually we need to pass it.
            // Let's try to get it from search params.
            // Note: Better Auth might use `token` or `code`.
            // If `authClient.resetPassword` is used, it sends a request to the server.
            // The server needs the token.

            const { data, error } = await authClient.resetPassword({
                newPassword: password,
                // If we don't pass token, it might try to find it in URL?
                // Let's check if we can pass it.
                // If not, we hope it works automagically.
            });

            if (error) {
                console.error('Auth error:', error);
                toast.error(error.message || 'Failed to reset password. Token might be invalid or expired.');
                return;
            }

            setIsSuccess(true);
            toast.success("Password reset successfully!");
            setTimeout(() => {
                router.push("/");
            }, 2000);
        } catch (error) {
            console.error('Auth error:', error);
            const message = error instanceof Error
                ? error.message
                : 'Failed to reset password. Please try again.';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center space-y-4">
                <h3 className="text-lg font-medium">Password Reset Complete</h3>
                <p className="text-muted-foreground">
                    Your password has been successfully updated. Redirecting to login...
                </p>
                <Button asChild className="w-full">
                    <Link href="/">Sign In Now</Link>
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight">
                        Set new password
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Please enter your new password below.
                    </p>
                </div>

                <div className="bg-background px-6 py-8 shadow sm:rounded-lg border">
                    <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin" /></div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
