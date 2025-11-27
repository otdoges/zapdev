"use client";

import { useEffect } from "react";
import { useClerk, useUser } from "@clerk/nextjs";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const { openSignIn, openSignUp } = useClerk();
  const { user } = useUser();

  useEffect(() => {
    if (isOpen && !user) {
      if (mode === "signin") {
        openSignIn({
          afterSignInUrl: "/",
          afterSignUpUrl: "/",
          appearance: {
            elements: {
              modalBackdrop: "z-[100]",
            }
          }
        });
      } else {
        openSignUp({
          afterSignInUrl: "/",
          afterSignUpUrl: "/",
          appearance: {
            elements: {
              modalBackdrop: "z-[100]",
            }
          }
        });
      }
      // We close our controlled state because Clerk handles the modal now
      onClose();
    }
  }, [isOpen, mode, openSignIn, openSignUp, onClose, user]);

  return null;
}
