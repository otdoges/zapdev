'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import UsageLimitModal from './UsageLimitModal';

interface ConversationHistorySidebarProps {
  onChatSelect?: (chatId: Id<'chats'>) => void;
  onNewChat?: () => void;
  className?: string;
  isVisible?: boolean;
}

export default function ConversationHistorySidebar({ 
  onChatSelect, 
  onNewChat,
  className = '',
  isVisible = true 
}: ConversationHistorySidebarProps) {
  const { isSignedIn, user } = useUser();
  const [newChatTitle, setNewChatTitle] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<Id<'chats'> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLimitModal, setShowLimitModal] = useState(false);
  
  // Convex queries and mutations
  const chats = useQuery(api.chats.getUserChats, isSignedIn ? { limit: 50 } : 'skip');
  const chatStats = useQuery(api.chats.getUserChatStats, isSignedIn ? {} : 'skip');
  const searchResults = useQuery(
    api.chats.searchChats, 
    searchTerm.length >= 2 && isSignedIn ? { searchTerm, limit: 20 } : 'skip'
  );
  const createChat = useMutation(api.chats.createChat);
  const deleteChat = useMutation(api.chats.deleteChat);
  
  // Use search results if searching, otherwise use regular chats
  const chatsToShow = searchTerm.length >= 2 && searchResults ? searchResults : (chats?.chats || []);
  
  const currentUsage = chatStats?.totalChats || 0;
  const limit = 5; // Free plan limit
  const canCreateConversation = currentUsage < limit;

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
    if (!newChatTitle.trim() || isCreating || !isSignedIn) return;
    
    // Check usage limit before creating
    if (!checkUsageLimit()) {
      return; // Usage limit modal will be shown
    }
    
    setIsCreating(true);
    try {
      const chatId = await createChat({ title: newChatTitle.trim() });
      setNewChatTitle('');
      setSelectedChatId(chatId);
      onChatSelect?.(chatId);
      onNewChat?.();
    } catch (error: any) {
      console.error('Failed to create chat:', error);
      if (error.message?.includes('limit')) {
        setShowLimitModal(true);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectChat = (chatId: Id<'chats'>) => {
    setSelectedChatId(chatId);
    onChatSelect?.(chatId);
  };

  const handleDeleteChat = async (chatId: Id<'chats'>) => {
    try {
      await deleteChat({ chatId });
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
    } catch (error: any) {
      console.error('Failed to delete chat:', error);
    }
  };

  // Show sign-in prompt if not authenticated
  if (!isSignedIn) {
    return (
      <motion.div 
        className={`w-80 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col shadow-2xl ${className}`}
        initial={{ x: -320, opacity: 0 }}
        animate={{ 
          x: isVisible ? 0 : -320, 
          opacity: isVisible ? 1 : 0 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Conversation History</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Sign in to save and access your conversation history</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`w-80 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col shadow-2xl ${className}`}
      initial={{ x: -320, opacity: 0 }}
      animate={{ 
        x: isVisible ? 0 : -320, 
        opacity: isVisible ? 1 : 0 
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
        <motion.div 
          className="flex items-center justify-between mb-4"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg">Conversations</h3>
          </div>
          <span className="text-xs text-slate-400 bg-slate-800/60 px-2 py-1 rounded-full border border-slate-600/50">
            {currentUsage}/{limit} free
          </span>
        </motion.div>
        
        {/* Search */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative mb-4">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="pl-10 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all duration-200 hover:bg-slate-800/70"
            />
          </div>
        </motion.div>
        
        {/* New Chat */}
        <motion.div 
          className="flex gap-2"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Input
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="New conversation..."
            className="flex-1 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all duration-200 hover:bg-slate-800/70"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateChat()}
            disabled={isCreating}
          />
          <Button 
            onClick={handleCreateChat} 
            disabled={!newChatTitle.trim() || isCreating || !canCreateConversation}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            {isCreating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </motion.div>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {chatsToShow?.map((chat, index) => (
            <motion.div
              key={chat._id}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30, 
                delay: index * 0.05 
              }}
              whileHover={{ 
                x: 4, 
                scale: 1.02,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              className={`relative p-4 border-b border-slate-800/50 cursor-pointer group transition-all duration-300 ${
                selectedChatId === chat._id 
                  ? 'bg-gradient-to-r from-orange-500/10 to-orange-600/5 border-l-4 border-l-orange-500' 
                  : 'hover:bg-slate-800/30'
              }`}
              onClick={() => handleSelectChat(chat._id)}
            >
              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              />
              
              <div className="relative flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    {/* Chat icon */}
                    <div className={`w-2 h-2 rounded-full mt-2 transition-all duration-200 ${
                      selectedChatId === chat._id 
                        ? 'bg-orange-500 shadow-lg shadow-orange-500/50' 
                        : 'bg-slate-600 group-hover:bg-orange-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm truncate group-hover:text-orange-100 transition-colors duration-200">
                        {chat.title}
                      </h4>
                      <p className="text-slate-400 text-xs mt-1 group-hover:text-slate-300 transition-colors duration-200">
                        {new Date(chat.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Delete button */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat._id);
                  }}
                  className="text-slate-500 hover:text-red-400 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-md hover:bg-red-500/10"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty States */}
        {chatsToShow?.length === 0 && !searchTerm && (
          <motion.div 
            className="flex-1 flex items-center justify-center p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm mb-1">No conversations yet</p>
              <p className="text-slate-400 text-xs leading-relaxed">Create your first conversation above to get started</p>
            </div>
          </motion.div>
        )}

        {searchTerm.length >= 2 && chatsToShow?.length === 0 && (
          <motion.div 
            className="flex-1 flex items-center justify-center p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600/20 to-slate-700/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm mb-1">No conversations found</p>
              <p className="text-slate-400 text-xs leading-relaxed">Try a different search term or create a new conversation</p>
            </div>
          </motion.div>
        )}

        {searchTerm.length >= 1 && searchTerm.length < 2 && (
          <motion.div 
            className="p-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-slate-400 text-xs">Type at least 2 characters to search</p>
          </motion.div>
        )}
      </div>

      {/* Footer with usage stats */}
      <motion.div 
        className="p-4 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="text-xs text-slate-400 space-y-2">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
              This month:
            </span>
            <span className="text-white font-medium">{chatStats?.monthlyChats || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
              Total:
            </span>
            <span className="text-white font-medium">{chatStats?.totalChats || 0}</span>
          </div>
          
          {/* Progress bar for free plan */}
          <div className="mt-3 pt-2 border-t border-slate-700/30">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-500">Free plan usage</span>
              <span className="text-xs text-slate-400">{currentUsage}/{limit}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <motion.div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((currentUsage / limit) * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Usage Limit Modal */}
      <UsageLimitModal
        isOpen={showLimitModal}
        onClose={closeLimitModal}
        currentUsage={currentUsage}
        limit={limit}
      />
    </motion.div>
  );
}