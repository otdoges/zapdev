"use client";

import { useSession, signIn, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function AuthButtons() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-zinc-300 text-sm">{session.user.email}</span>
        <Button 
          variant="ghost" 
          onClick={handleSignOut}
          disabled={isLoading}
          className="text-zinc-300 hover:text-white hover:bg-zinc-800"
        >
          {isLoading ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        onClick={() => window.location.href = "/auth"}
        className="text-zinc-300 hover:text-white hover:bg-zinc-800"
      >
        Login
      </Button>
      <Button 
        onClick={() => window.location.href = "/auth"}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        Sign Up
      </Button>
    </div>
  );
} 