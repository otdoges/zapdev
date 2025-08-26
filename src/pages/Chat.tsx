import React from 'react';
import Navigation from '@/components/Navigation';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';

// Enhanced full page chat with open-lovable inspired design
const Chat: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground">
      <Navigation />

      <main className="pt-20">
        <div className="h-[calc(100vh-5rem)] bg-[#0A0A0A] border border-white/10 overflow-hidden">
          <EnhancedChatInterface />
        </div>
      </main>
    </div>
  );
};

export default Chat;