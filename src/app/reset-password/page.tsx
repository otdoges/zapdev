"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { extractResetToken } from "@/lib/reset-password";
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

function ErrorView({ message }: { message: string }) {
    return (
        <div className="text-center space-y-4">
            <h3 className="text-lg font-medium">Unable to reset password</h3>
            <p className="text-muted-foreground">{message}</p>
            <Button asChild className="w-full">
                <Link href="/handler/forgot-password">Request a new reset link</Link>
            </Button>
        </div>
    );
}

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = extractResetToken(searchParams);

    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    if (!token) {
        return <ErrorView message="Invalid or missing reset token. Please use the link from your email." />;
    }

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

            const { data, error } = await authClient.resetPassword({
                newPassword: password,
                token,
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
                    Your password has been successfully updated. Redirecting to sign in...
                </p>
                <Button asChild className="w-full">
                    <Link href="/handler/sign-in">Sign in now</Link>
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
