'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import PricingModal from './PricingModal';
import SettingsModal from './SettingsModal';

interface ConvexChatProps {
  onChatSelect?: (chatId: Id<"chats">) => void;
  onMessageAdd?: (message: string, type: 'user' | 'ai') => void;
}

export default function ConvexChat({ onChatSelect, onMessageAdd }: ConvexChatProps) {
  const { isSignedIn, user } = useUser();
  const [newChatTitle, setNewChatTitle] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<Id<"chats"> | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Check if Convex is configured
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const isConvexConfigured = convexUrl && !convexUrl.includes('your_convex_url') && !convexUrl.includes('your-convex-url');

  // Debug authentication status
  useEffect(() => {
    const authStatus = isSignedIn ? 'signed in' : 'not signed in';
    const userInfo = user ? `User: ${user.emailAddresses?.[0]?.emailAddress || 'No email'}` : 'No user data';
    const convexStatus = isConvexConfigured ? 'Convex configured' : 'Convex not configured';
    setDebugInfo(`Auth: ${authStatus}, ${userInfo}, ${convexStatus}`);
    console.log('[ConvexChat] Status:', { isSignedIn, user: user?.emailAddresses?.[0]?.emailAddress, isConvexConfigured });
  }, [isSignedIn, user, isConvexConfigured]);

  // Convex queries and mutations with error handling
  const chats = useQuery(api.chats.getUserChats, isSignedIn ? { limit: 50 } : 'skip');
  const messages = useQuery(
    api.messages.getChatMessages, 
    selectedChatId && isSignedIn ? { chatId: selectedChatId } : "skip"
  );
  
  const createChat = useMutation(api.chats.createChat);
  const createMessage = useMutation(api.messages.createMessage);
  const deleteChat = useMutation(api.chats.deleteChat);

  // Debug Convex queries
  useEffect(() => {
    console.log('[ConvexChat] Chats query result:', chats);
  }, [chats]);

  useEffect(() => {
    console.log('[ConvexChat] Messages query result:', messages);
  }, [messages]);

  // Auto-select first chat if available and none selected
  useEffect(() => {
    if (chats?.chats && chats.chats.length > 0 && !selectedChatId) {
      const firstChat = chats.chats[0];
      setSelectedChatId(firstChat._id);
      onChatSelect?.(firstChat._id);
      console.log('Auto-selected first chat:', firstChat.title);
    }
  }, [chats?.chats, selectedChatId, onChatSelect]);

  // Clear error after a few seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleCreateChat = async () => {
    if (!newChatTitle.trim() || loading) return;
    
    // Check Convex configuration first
    if (!isConvexConfigured) {
      setError('Convex database not configured. See setup-convex.md for instructions.');
      return;
    }
    
    // Check authentication
    if (!isSignedIn) {
      setError('Please sign in to create chats');
      return;
    }
    
    // Check if user has reached the free plan limit (5 chats)
    const currentChatCount = chats?.chats?.length || 0;
    if (currentChatCount >= 5) {
      setShowPricingModal(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[ConvexChat] Creating chat with title:', newChatTitle.trim());
      console.log('[ConvexChat] User authenticated:', isSignedIn);
      console.log('[ConvexChat] User ID:', user?.id);
      console.log('[ConvexChat] Convex configured:', isConvexConfigured);
      
      const chatId = await createChat({ title: newChatTitle.trim() });
      console.log('[ConvexChat] Chat created successfully:', chatId);
      
      setNewChatTitle('');
      setSelectedChatId(chatId);
      onChatSelect?.(chatId);
      setError(null);
    } catch (error: any) {
      console.error('[ConvexChat] Failed to create chat:', error);
      
      // Provide specific error messages
      if (error.message?.includes('User must be authenticated')) {
        setError('Authentication failed. Please sign out and sign back in.');
      } else if (error.message?.includes('ConvexError')) {
        setError('Database connection failed. Check Convex configuration.');
      } else {
        setError(`Failed to create chat: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = (chatId: Id<"chats">) => {
    setSelectedChatId(chatId);
    onChatSelect?.(chatId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId || loading) return;

    setLoading(true);
    setError(null);
    
    try {
      console.log('Sending message to chat:', selectedChatId);
      await createMessage({
        chatId: selectedChatId,
        content: newMessage.trim(),
        role: 'user'
      });
      
      console.log('Message sent successfully');
      onMessageAdd?.(newMessage.trim(), 'user');
      setNewMessage('');
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setError(`Failed to send message: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: Id<"chats">) => {
    try {
      // Get the chat title for confirmation
      const chat = chats?.chats?.find(c => c._id === chatId);
      if (chat) {
        await deleteChat({ chatId, confirmTitle: chat.title });
        if (selectedChatId === chatId) {
          setSelectedChatId(null);
        }
      }
    } catch (error: any) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleUpgrade = async (plan: string) => {
    // Integration with Stripe will be handled here
    console.log('Upgrading to plan:', plan);
    setShowPricingModal(false);
    // TODO: Integrate with Stripe checkout
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Authentication Check */}
      {!isSignedIn ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center p-8">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-lg font-medium mb-2 text-white">Sign In Required</h3>
            <p className="text-gray-400 mb-4">Please sign in to access your chat history and create new conversations.</p>
            <p className="text-xs text-gray-500">Your chats will be synchronized across all your devices.</p>
          </div>
        </div>
      ) : !isConvexConfigured ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center p-8">
            <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium mb-2 text-white">Convex Not Configured</h3>
            <p className="text-gray-400 mb-4">Chat history requires Convex database configuration.</p>
            <div className="text-xs text-gray-500 space-y-2">
              <p>To enable chat history:</p>
              <ol className="list-decimal list-inside space-y-1 text-left">
                <li>Go to <span className="text-blue-400">dashboard.convex.dev</span></li>
                <li>Create a new project</li>
                <li>Copy your Convex URL</li>
                <li>Update NEXT_PUBLIC_CONVEX_URL in .env.local</li>
                <li>Restart the development server</li>
              </ol>
              <p className="mt-3">See <span className="text-blue-400">setup-convex.md</span> for detailed instructions.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="p-2 bg-blue-900 text-blue-200 text-xs border-b border-blue-700">
              Debug: {debugInfo}
            </div>
          )}
          
          {/* Settings Header */}
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Chat History</h2>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-900 border border-red-700 text-red-100 text-sm">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
      
          <div className="flex-1 flex overflow-hidden">
        {/* Chat Sidebar */}
        <div className="w-80 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex gap-2">
              <Input
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="New chat title..."
                className="flex-1"
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateChat()}
              />
              <Button 
                onClick={handleCreateChat} 
                disabled={!newChatTitle.trim() || loading}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </Button>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {chats === undefined ? (
              <div className="p-4 text-gray-500 text-center">
                <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading chats...
              </div>
            ) : chats?.chats?.length > 0 ? (
              chats.chats.map((chat) => (
                <motion.div
                  key={chat._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${
                    selectedChatId === chat._id ? 'bg-gray-800 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleSelectChat(chat._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm truncate">
                        {chat.title}
                      </h3>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat._id);
                      }}
                      className="text-gray-500 hover:text-red-400 ml-2 disabled:opacity-50"
                      disabled={loading}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-4 text-gray-500 text-center">
                <div className="mb-2">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                No chats yet. Create your first chat!
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedChatId ? (
            <>
              {/* Messages Header */}
              <div className="p-4 border-b border-gray-700 bg-gray-800">
                <h2 className="text-white font-medium text-sm">
                  {chats?.chats?.find(c => c._id === selectedChatId)?.title || 'Chat'}
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  {messages?.messages?.length || 0} messages
                </p>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages === undefined ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading messages...
                    </div>
                  </div>
                ) : messages?.messages?.length > 0 ? (
                  <AnimatePresence>
                    {messages.messages.map((message) => (
                      <motion.div
                        key={message._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : message.role === 'assistant'
                              ? 'bg-gray-800 text-gray-100'
                              : 'bg-gray-700 text-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p>No messages yet</p>
                      <p className="text-xs mt-1">Start the conversation!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={loading}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || loading}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">Select a Chat</h3>
                <p>Choose a chat from the sidebar or create a new one to start messaging.</p>
                <p className="text-xs mt-2 text-gray-600">Your chat history will be synchronized across devices.</p>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}
      
      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onUpgrade={handleUpgrade}
      />
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}