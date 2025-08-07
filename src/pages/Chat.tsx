import React from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import ChatInterface from '@/components/ChatInterface';

// Full page chat that visually matches the home page theme
const Chat: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation />

      {/* Background layer for home-page look */}
      <div className="absolute inset-0 -z-10 bg-[#0A0A0A]" />
      <div 
        className="absolute left-0 top-0 w-full h-full -z-10 rounded-full"
        style={{
          background: '#377AFB',
          opacity: 0.1,
          boxShadow: '300px 300px 300px',
          filter: 'blur(150px)'
        }}
      />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-20"
      >
        <div className="px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="h-[calc(100vh-6rem)] bg-card/60 border border-white/10 rounded-2xl shadow-sm overflow-hidden backdrop-blur-sm"
          >
            <ChatInterface />
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
};

export default Chat;