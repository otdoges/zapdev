'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface ConvexChatProps {
  onChatSelect?: (chatId: Id<"chats">) => void;
  onMessageAdd?: (message: string, type: 'user' | 'ai') => void;
}

export default function ConvexChat({ onChatSelect, onMessageAdd }: ConvexChatProps) {
  const [newChatTitle, setNewChatTitle] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<Id<"chats"> | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Convex queries and mutations
  const chats = useQuery(api.chats.getUserChats, { limit: 50 });
  const messages = useQuery(
    api.messages.getChatMessages, 
    selectedChatId ? { chatId: selectedChatId } : "skip"
  );
  
  const createChat = useMutation(api.chats.createChat);
  const createMessage = useMutation(api.messages.createMessage);
  const deleteChat = useMutation(api.chats.deleteChat);

  const handleCreateChat = async () => {
    if (!newChatTitle.trim()) return;
    
    try {
      const chatId = await createChat({ title: newChatTitle.trim() });
      setNewChatTitle('');
      setSelectedChatId(chatId);
      onChatSelect?.(chatId);
    } catch (error: any) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleSelectChat = (chatId: Id<"chats">) => {
    setSelectedChatId(chatId);
    onChatSelect?.(chatId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId) return;

    try {
      await createMessage({
        chatId: selectedChatId,
        content: newMessage.trim(),
        role: 'user'
      });
      
      onMessageAdd?.(newMessage.trim(), 'user');
      setNewMessage('');
    } catch (error: any) {
      console.error('Failed to send message:', error);
    }
  };

  const handleDeleteChat = async (chatId: Id<"chats">) => {
    try {
      await deleteChat({ chatId, confirmDelete: true });
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
    } catch (error: any) {
      console.error('Failed to delete chat:', error);
    }
  };

  return (
    <div className="h-full bg-gray-900 flex">
      {/* Chat Sidebar */}
      <div className="w-80 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex gap-2">
            <Input
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              placeholder="New chat title..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateChat()}
            />
            <Button onClick={handleCreateChat} disabled={!newChatTitle.trim()}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats?.chats?.map((chat) => (
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
                  className="text-gray-500 hover:text-red-400 ml-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}

          {chats?.chats?.length === 0 && (
            <div className="p-4 text-gray-500 text-center">
              No chats yet. Create your first chat!
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedChatId ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages?.map((message) => (
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
                          : 'bg-gray-800 text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Select a Chat</h3>
              <p>Choose a chat from the sidebar or create a new one to start messaging.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}