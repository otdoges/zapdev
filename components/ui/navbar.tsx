"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useConvexAuth();
  
  return (
    <nav className="w-full py-4 px-6 bg-slate-900 border-b border-slate-800">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link 
            href="/"
            className="text-xl font-bold"
          >
            ZapDev
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/auth-example"
              className={`px-3 py-1.5 rounded-md ${pathname === '/auth-example' ? 'bg-slate-800' : 'hover:bg-slate-800'}`}
            >
              Auth Example
            </Link>
            <Link 
              href="/chat"
              className={`px-3 py-1.5 rounded-md ${pathname.startsWith('/chat') ? 'bg-slate-800' : 'hover:bg-slate-800'}`}
            >
              Chat
            </Link>
          </div>
        </div>
        
        <div>
          {isAuthenticated && <UserButton afterSignOutUrl="/" />}
        </div>
      </div>
    </nav>
  );
} 