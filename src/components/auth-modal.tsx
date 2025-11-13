"use client";

import { useEffect, useState } from "react";
import { SignIn, SignUp } from "@stackframe/stack";
import { useUser } from "@stackframe/stack";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const user = useUser();
  const [previousUser, setPreviousUser] = useState(user);

  // Auto-close modal when user successfully signs in
  useEffect(() => {
    if (!previousUser && user) {
      // User just signed in
      toast.success("Welcome back!", {
        description: `Signed in as ${user.displayName || user.primaryEmail}`,
      });
      onClose();
    }
    setPreviousUser(user);
  }, [user, previousUser, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "signin" ? "Sign in to ZapDev" : "Create your account"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {mode === "signin" ? <SignIn /> : <SignUp />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
