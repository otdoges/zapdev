import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import { AuthButtons } from "@/components/auth-buttons";

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  const isSignedIn = !!session?.user;

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
            <AuthButtons />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/chat">
                <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800">
                  Chat
                </Button>
              </Link>
              <AuthButtons />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 