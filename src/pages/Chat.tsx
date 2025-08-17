import React from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';

// Enhanced full page chat with stunning visuals
const Chat: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--color-chat-bg)] text-foreground">
      <Navigation />

      {/* Enhanced background with multiple gradients */}
      <div className="absolute inset-0 -z-10">
        {/* Base background */}
        <div className="absolute inset-0 bg-[var(--color-chat-bg)]" />
        
        {/* Static gradient orbs - much more performant */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{ 
            background: "radial-gradient(circle, hsl(262 83% 58%) 0%, transparent 70%)",
            filter: 'blur(100px)' 
          }}
        />
        
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-5"
          style={{ 
            background: "radial-gradient(circle, hsl(224 82% 60%) 0%, transparent 70%)",
            filter: 'blur(120px)' 
          }}
        />
        
        {/* Subtle noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="pt-20"
      >
        <div className="px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.2,
              ease: "easeOut",
              type: "spring",
              stiffness: 100
            }}
            className="h-[calc(100vh-6rem)] glass-elevated rounded-2xl overflow-hidden relative"
          >
            {/* Enhanced border glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-blue-600/20 to-primary/20 rounded-2xl blur opacity-50 animate-pulse-glow" />
            
            <div className="relative h-full bg-[var(--color-chat-bg)]/95 backdrop-blur-xl rounded-2xl border border-white/10">
              <EnhancedChatInterface />
            </div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
};

export default Chat;