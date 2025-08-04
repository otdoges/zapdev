import React from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import ChatInterface from '@/components/ChatInterface';

const Chat: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-16"
      >
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="h-[calc(100vh-8rem)] bg-card border rounded-lg shadow-sm overflow-hidden"
          >
            <ChatInterface />
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
};

export default Chat; 