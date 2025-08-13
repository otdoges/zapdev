import React, { Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
const ChatInterface = React.lazy(() => import('@/components/ChatInterface'));

// Full page chat that visually matches the home page theme
const Chat: React.FC = () => {
  // Prefetch ChatInterface asap to minimize skeleton time
  useEffect(() => {
    import('@/components/ChatInterface');
  }, []);

  return (
    <div className="min-h-screen bg-black text-foreground relative overflow-hidden">
      <Navigation />

      {/* Background layers inspired by Anything: soft radial glows + subtle grid */}
      <div className="absolute inset-0 -z-10 bg-[#0A0A0A]" />
      <div className="pointer-events-none absolute -z-10 inset-0">
        <div className="absolute -top-40 -left-40 w-[60vw] h-[60vw] rounded-full opacity-20 blur-[100px]" style={{
          background: 'radial-gradient(closest-side, #377AFB, transparent)'
        }} />
        <div className="absolute -bottom-48 -right-32 w-[55vw] h-[55vw] rounded-full opacity-15 blur-[110px]" style={{
          background: 'radial-gradient(closest-side, #7C3AED, transparent)'
        }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[40vw] h-[40vw] rounded-full opacity-10 blur-[90px]" style={{
          background: 'radial-gradient(closest-side, #06B6D4, transparent)'
        }} />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.12) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-24"
      >
        <div className="px-4">
          {/* Hero heading area */}
          <div className="max-w-5xl mx-auto text-center mb-5">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#60A5FA] via-[#A78BFA] to-[#34D399]">Build something real</span>
            </h1>
            <p className="mt-2 text-sm md:text-base text-muted-foreground">Create powerful apps by chatting. Optimized, fast, and beautiful.</p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="h-[calc(100vh-8rem)] bg-[#0F1012]/70 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl max-w-7xl mx-auto"
          >
            <Suspense
              fallback={
                <div className="w-full h-full grid place-items-center">
                  <div className="w-full h-full animate-pulse">
                    <div className="h-16 border-b border-white/10 bg-white/5" />
                    <div className="p-6 space-y-4">
                      <div className="h-6 w-1/3 bg-white/5 rounded" />
                      <div className="h-5 w-2/3 bg-white/5 rounded" />
                      <div className="h-5 w-1/2 bg-white/5 rounded" />
                      <div className="h-[50vh] bg-white/5 rounded-xl" />
                    </div>
                  </div>
                </div>
              }
            >
              <ChatInterface />
            </Suspense>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
};

export default Chat;