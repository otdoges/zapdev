import React from 'react';
import Navigation from '@/components/Navigation';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';

// Enhanced full page chat with stunning visuals
const Chat: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--color-chat-bg)] text-foreground">
      <Navigation />

      <main className="pt-20">
        <div className="px-4">
          <div className="h-[calc(100vh-6rem)] bg-[var(--color-chat-bg)] rounded-xl border border-white/10 overflow-hidden">
            <EnhancedChatInterface />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;