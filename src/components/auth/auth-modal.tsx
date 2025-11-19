import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SocialAuthButtons } from "./auth-buttons";

export function AuthModal({
    children,
    isOpen: externalIsOpen,
    onClose,
    mode = "signin"
}: {
    children?: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
    mode?: "signin" | "signup";
}) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const setIsOpen = onClose ? (open: boolean) => !open && onClose() : setInternalIsOpen;

    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    // Reset state when mode changes if needed, or just use the prop to set default tab
    // We'll use the mode prop to control the default tab value


    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await authClient.signIn.email({
                email,
                password,
                callbackURL: "/dashboard",
            });
            setIsOpen(false);
        } catch (error) {
            toast.error("Invalid credentials. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await authClient.signUp.email({
                email,
                password,
                name,
                callbackURL: "/dashboard",
            });
            setIsOpen(false);
            toast.success("Account created successfully!");
        } catch (error) {
            toast.error("Failed to create account. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden gap-0">
                <div className="p-6 pt-8 text-center bg-muted/50">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">
                            Welcome back
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Sign in to your account to continue
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    <Tabs defaultValue={mode} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="signin">Sign In</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        <TabsContent value="signin" className="space-y-4">
                            <SocialAuthButtons />

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

                            <form onSubmit={handleSignIn} className="space-y-4">
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
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sign In
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup" className="space-y-4">
                            <SocialAuthButtons />

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

                            <form onSubmit={handleSignUp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <Input
                                        id="signup-email"
                                        type="email"
                                        placeholder="m@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <Input
                                        id="signup-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Account
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
