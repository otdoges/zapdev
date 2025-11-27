"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const { user } = useUser();

  useEffect(() => {
    if (isOpen && !user) {
      const redirectUrl = `${window.location.origin}/`;
      const hostedPage =
        mode === "signin"
          ? `https://clerk.zapdev.link/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`
          : `https://clerk.zapdev.link/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`;

      // Use hosted Clerk pages instead of the in-app modal to avoid popup/cors issues
      window.location.assign(hostedPage);
      onClose();
    }
  }, [isOpen, mode, onClose, user]);

  return null;
}
