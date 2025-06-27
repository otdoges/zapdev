'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0D0D10] p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          <div className="animate-blob absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#6C52A0] mix-blend-multiply blur-3xl filter"></div>
          <div className="animate-blob animation-delay-2000 absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-[#A0527C] mix-blend-multiply blur-3xl filter"></div>
          <div className="animate-blob animation-delay-4000 absolute bottom-1/4 left-1/3 h-96 w-96 rounded-full bg-[#4F3A75] mix-blend-multiply blur-3xl filter"></div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto max-w-lg text-center"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="bg-gradient-to-r from-[#6C52A0] to-[#A0527C] bg-clip-text text-[150px] font-bold leading-none text-transparent">
            404
          </h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto h-1 max-w-[200px] bg-gradient-to-r from-[#6C52A0] to-[#A0527C]"
          />
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8 space-y-4"
        >
          <h2 className="text-3xl font-bold text-white">Page Not Found</h2>
          <p className="text-lg text-[#EAEAEA]/70">
            Oops! The page you're looking for seems to have wandered off into the digital void.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col justify-center gap-4 sm:flex-row"
        >
          <Link href="/">
            <Button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C52A0] to-[#A0527C] px-6 py-3 text-white hover:from-[#7C62B0] hover:to-[#B0627C]">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>

          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="flex items-center gap-2 rounded-xl border-[#EAEAEA]/20 px-6 py-3 text-white hover:border-[#EAEAEA]/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 space-y-2"
        >
          <p className="text-sm text-[#EAEAEA]/50">Popular destinations:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/chat" className="text-[#6C52A0] transition-colors hover:text-[#7C62B0]">
              Chat
            </Link>
            <Link href="/pricing" className="text-[#6C52A0] transition-colors hover:text-[#7C62B0]">
              Pricing
            </Link>
            <Link href="/auth" className="text-[#6C52A0] transition-colors hover:text-[#7C62B0]">
              Sign In
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
