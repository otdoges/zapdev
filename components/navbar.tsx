import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-black to-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              ZapDev
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-zinc-300 hover:text-white transition-colors">
            Pricing
          </Link>
          
          {!isSignedIn ? (
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800">
                  Login
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800">
                  Dashboard
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 