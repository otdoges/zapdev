"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";

interface AuthPopupContextValue {
  isOpen: boolean;
  mode: "sign-in" | "sign-up";
  redirectUrl: string;
  openSignIn: (redirect?: string) => void;
  openSignUp: (redirect?: string) => void;
  close: () => void;
  setMode: (mode: "sign-in" | "sign-up") => void;
  setRedirect: (url: string) => void;
}

const AuthPopupContext = createContext<AuthPopupContextValue | undefined>(undefined);

export const useAuthPopup = () => {
  const context = useContext(AuthPopupContext);
  if (!context) {
    throw new Error("useAuthPopup must be used within AuthPopupProvider");
  }
  return context;
};

interface AuthPopupProviderProps {
  children: ReactNode;
}

export const AuthPopupProvider = ({ children }: AuthPopupProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [redirectUrl, setRedirectUrl] = useState("/dashboard");

  const openSignIn = (redirect?: string) => {
    if (redirect) {
      setRedirectUrl(redirect);
    }
    setMode("sign-in");
    setIsOpen(true);
  };

  const openSignUp = (redirect?: string) => {
    if (redirect) {
      setRedirectUrl(redirect);
    }
    setMode("sign-up");
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const setRedirect = (url: string) => {
    setRedirectUrl(url);
  };

  const value: AuthPopupContextValue = {
    isOpen,
    mode,
    redirectUrl,
    openSignIn,
    openSignUp,
    close,
    setMode,
    setRedirect,
  };

  return (
    <AuthPopupContext.Provider value={value}>
      {children}
    </AuthPopupContext.Provider>
  );
};
