'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import UsageLimitModal from './UsageLimitModal';

// Mock types for when Convex is not available
type MockChatId = string;

interface MockChat {
  _id: MockChatId;
  title: string;
  updatedAt: number;
  createdAt: number;
}

// Mock data for development without Convex
const mockChats: MockChat[] = [
  {
    _id: 'chat1',
    title: 'React Todo App',
    updatedAt: Date.now() - 1000 * 60 * 30, // 30 mins ago
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
  },
  {
    _id: 'chat2', 
    title: 'E-commerce Landing Page',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
  },
  {
    _id: 'chat3',
    title: 'Dashboard with Charts',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
  }
];

const mockChatStats = {
  totalChats: 3,
  monthlyChats: 3,
  recentChats: 1
};

interface ConversationHistorySidebarProps {
  onChatSelect?: (chatId: MockChatId) => void;
  onNewChat?: () => void;
  className?: string;
}

export default function ConversationHistorySidebar({ 
  onChatSelect, 
  onNewChat,
  className = '' 
}: ConversationHistorySidebarProps) {
  const { isSignedIn, user } = useUser();
  const [newChatTitle, setNewChatTitle] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<MockChatId | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock usage limit logic
  const [showLimitModal, setShowLimitModal] = useState(false);
  const currentUsage = mockChatStats.totalChats;
  const limit = 5;
  const canCreateConversation = currentUsage < limit;
  
  // Use mock data for now
  const chatsToShow = searchTerm.length >= 2 
    ? mockChats.filter(chat => chat.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : mockChats;

  const checkUsageLimit = () => {
    if (currentUsage >= limit) {
      setShowLimitModal(true);
      return false;
    }
    return true;
  };

  const handleLimitReached = () => setShowLimitModal(true);
  const closeLimitModal = () => setShowLimitModal(false);

  const handleCreateChat = async () => {
    if (!newChatTitle.trim() || isCreating) return;
    
    // Check usage limit before creating
    if (!checkUsageLimit()) {
      return; // Usage limit modal will be shown
    }
    
    setIsCreating(true);
    try {
      // Mock chat creation
      const newChat: MockChat = {
        _id: `chat${Date.now()}`,
        title: newChatTitle.trim(),
        updatedAt: Date.now(),
        createdAt: Date.now()
      };
      
      mockChats.unshift(newChat); // Add to beginning
      setNewChatTitle('');
      setSelectedChatId(newChat._id);
      onChatSelect?.(newChat._id);
      onNewChat?.();
    } catch (error: any) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectChat = (chatId: MockChatId) => {
    setSelectedChatId(chatId);
    onChatSelect?.(chatId);
  };

  const handleDeleteChat = async (chatId: MockChatId) => {
    try {
      const chatIndex = mockChats.findIndex(c => c._id === chatId);
      if (chatIndex > -1) {
        mockChats.splice(chatIndex, 1);
        if (selectedChatId === chatId) {
          setSelectedChatId(null);
        }
        // Force re-render by updating search term
        setSearchTerm(prev => prev + '');
      }
    } catch (error: any) {
      console.error('Failed to delete chat:', error);
    }
  };

  // Show sign-in prompt if not authenticated
  if (!isSignedIn) {
    return (
      <div className={`w-80 bg-gray-900 border-r border-gray-700 flex flex-col ${className}`}>
        <div className="p-4 text-center">
          <h3 className="text-white font-medium mb-2">Conversation History</h3>
          <p className="text-gray-400 text-sm mb-4">Sign in to save and access your conversation history</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 bg-gray-900 border-r border-gray-700 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">Conversations</h3>
          <span className="text-xs text-gray-400">
            {currentUsage}/{limit} free
          </span>
        </div>
        
        {/* Search */}
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search conversations..."
          className="mb-3 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
        />
        
        {/* New Chat */}
        <div className="flex gap-2">
          <Input
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="New conversation..."
            className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateChat()}
            disabled={isCreating}
          />
          <Button 
            onClick={handleCreateChat} 
            disabled={!newChatTitle.trim() || isCreating || !canCreateConversation}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {chatsToShow?.map((chat) => (
            <motion.div
              key={chat._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors group ${
                selectedChatId === chat._id ? 'bg-gray-800 border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => handleSelectChat(chat._id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm truncate">
                    {chat.title}
                  </h4>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(chat.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat._id);
                  }}
                  className="text-gray-500 hover:text-red-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {chatsToShow?.length === 0 && !searchTerm && (
          <div className="p-4 text-gray-500 text-center">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs text-gray-600 mt-1">Create your first conversation above</p>
            </div>
          </div>
        )}

        {searchTerm.length >= 2 && chatsToShow?.length === 0 && (
          <div className="p-4 text-gray-500 text-center">
            <p className="text-sm">No conversations found</p>
            <p className="text-xs text-gray-600 mt-1">Try a different search term</p>
          </div>
        )}

        {searchTerm.length >= 1 && searchTerm.length < 2 && (
          <div className="p-4 text-gray-500 text-center">
            <p className="text-xs">Type at least 2 characters to search</p>
          </div>
        )}
      </div>

      {/* Footer with usage stats */}
      <div className="p-3 border-t border-gray-700 bg-gray-950">
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>This month:</span>
            <span>{mockChatStats.monthlyChats} conversations</span>
          </div>
          <div className="flex justify-between">
            <span>Total:</span>
            <span>{mockChatStats.totalChats} conversations</span>
          </div>
        </div>
      </div>

      {/* Usage Limit Modal */}
      <UsageLimitModal
        isOpen={showLimitModal}
        onClose={closeLimitModal}
        currentUsage={currentUsage}
        limit={limit}
      />
    </div>
  );
}