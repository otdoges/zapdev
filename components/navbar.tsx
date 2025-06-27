import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { Button } from '@/components/ui/button';
import { AuthButtons } from '@/components/auth-buttons';

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isSignedIn = !!user;

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-zinc-800 bg-gradient-to-b from-black to-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-2xl font-bold text-transparent">
              ZapDev
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-zinc-300 transition-colors hover:text-white">
            Pricing
          </Link>

          {!isSignedIn ? (
            <AuthButtons />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/chat">
                <Button
                  variant="ghost"
                  className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
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
