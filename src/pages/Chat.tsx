import React from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';

// Enhanced full page chat with stunning visuals
const Chat: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--color-chat-bg)] text-foreground">
      <Navigation />

      {/* Optimized background with reduced effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--color-chat-bg)]" />
        
        {/* Simplified static gradients - no blur for better performance */}
        <div 
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10"
          style={{ 
            background: "radial-gradient(circle, hsl(262 83% 58%) 0%, transparent 70%)"
          }}
        />
        
        <div 
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-10"
          style={{ 
            background: "radial-gradient(circle, hsl(224 82% 60%) 0%, transparent 70%)"
          }}
        />
      </div>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="pt-20"
      >
        <div className="px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="h-[calc(100vh-6rem)] glass-elevated rounded-2xl overflow-hidden relative"
          >
            {/* Simplified border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 via-blue-600/10 to-primary/10 rounded-2xl opacity-50" />
            
            <div className="relative h-full bg-[var(--color-chat-bg)]/95 backdrop-blur-sm rounded-2xl border border-white/10">
              <EnhancedChatInterface />
            </div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
};

export default Chat;