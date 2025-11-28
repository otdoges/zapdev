"use client";

import { useUser, SignIn, SignUp } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const { user } = useUser();

  if (user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 bg-transparent border-none shadow-none">
        <VisuallyHidden>
          <DialogTitle>Authentication</DialogTitle>
        </VisuallyHidden>
        {mode === "signin" ? (
          <SignIn routing="hash" />
        ) : (
          <SignUp routing="hash" />
        )}
      </DialogContent>
    </Dialog>
  );
}
