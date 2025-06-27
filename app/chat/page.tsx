'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    // Generate a new unique chat ID and redirect
    const chatId = uuidv4();
    router.push(`/chat/${chatId}`);
  }, [router]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0D0D10] text-white">
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-4 h-16 w-16"
        >
          <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C] opacity-20 blur-md" />
          <div className="absolute inset-2 flex items-center justify-center rounded-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C]">
            <svg
              className="h-6 w-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 16V12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8H12.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </motion.div>
        <motion.span
          className="text-xl font-medium text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Creating your chat session...
        </motion.span>
      </div>
    </div>
  );
}
