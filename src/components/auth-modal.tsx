"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSignInUrlAction, getSignUpUrlAction } from "@/app/actions";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const { user } = useAuth();
  const [previousUser, setPreviousUser] = useState(user);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!previousUser && user) {
      const name = user.firstName ? `${user.firstName} ${user.lastName}` : user.email;
      toast.success("Welcome back!", {
        description: `Signed in as ${name}`,
      });
      onClose();
    }
    setPreviousUser(user);
  }, [user, previousUser, onClose]);

  const handleAuth = async () => {
    try {
      setLoading(true);
      const url = mode === "signin" ? await getSignInUrlAction() : await getSignUpUrlAction();
      window.location.href = url;
    } catch (error) {
      console.error("Failed to get auth URL", error);
      toast.error("Failed to start authentication");
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "signin" ? "Sign in to ZapDev" : "Create your account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "signin" 
              ? "Sign in to access your projects and continue building with AI" 
              : "Create an account to start building web applications with AI"}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-center">
          <Button onClick={handleAuth} disabled={loading} className="w-full">
            {loading ? "Redirecting..." : (mode === "signin" ? "Continue to Sign In" : "Continue to Sign Up")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
