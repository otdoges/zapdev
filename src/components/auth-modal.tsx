"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { SignIn, SignUp } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const { user } = useUser();
  const [previousUser, setPreviousUser] = useState(user);

  useEffect(() => {
    if (!previousUser && user) {
      const name = user.fullName || user.primaryEmailAddress?.emailAddress;
      toast.success("Welcome back!", {
        description: `Signed in as ${name}`,
      });
      onClose();
    }
    setPreviousUser(user);
  }, [user, previousUser, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {mode === "signin" ? (
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none",
              },
            }}
            routing="hash"
          />
        ) : (
          <SignUp 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none",
              },
            }}
            routing="hash"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
