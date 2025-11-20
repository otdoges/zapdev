import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import Link from "next/link";

export default function ForgotPasswordPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight">
                        Reset your password
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className="bg-background px-6 py-8 shadow sm:rounded-lg border">
                    <ForgotPasswordForm />
                </div>

                <div className="text-center">
                    <Link
                        href="/"
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
