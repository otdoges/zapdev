'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { FiX, FiSearch, FiTrash2, FiMessageSquare, FiClock, FiPlus } from 'react-icons/fi';
import Image from 'next/image';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onChatSelect: (chatId: string, chat: any) => void;
  currentChatId?: string | null;
}

interface Chat {
  _id: string;
  title: string;
  screenshot?: string;
  sandboxId?: string;
  sandboxUrl?: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
}

export default function HistorySidebar({ isOpen, onClose, onChatSelect, currentChatId }: HistorySidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useUser();

  // Fetch user's chats
  const chatsData = useQuery(api.chats.getUserChats, user ? { limit: 50 } : 'skip');
  const deleteChat = useMutation(api.chats.deleteChat);
  const createChat = useMutation(api.chats.createChat);

  const chats = chatsData?.chats || [];

  // Filter chats based on search term
  const filteredChats = chats.filter((chat: Chat) =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group chats by date
  const groupChatsByDate = (chats: Chat[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups: { [key: string]: Chat[] } = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Older': []
    };

    chats.forEach((chat) => {
      const chatDate = new Date(chat.updatedAt);
      if (chatDate >= today) {
        groups['Today'].push(chat);
      } else if (chatDate >= yesterday) {
        groups['Yesterday'].push(chat);
      } else if (chatDate >= weekAgo) {
        groups['This Week'].push(chat);
      } else {
        groups['Older'].push(chat);
      }
    });

    return groups;
  };

  const groupedChats = groupChatsByDate(filteredChats);

  const handleDeleteSelected = async () => {
    if (selectedChats.size === 0) return;
    
    setIsDeleting(true);
    try {
      for (const chatId of selectedChats) {
        await deleteChat({ chatId: chatId as any });
      }
      setSelectedChats(new Set());
    } catch (error) {
      console.error('Failed to delete chats:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const chatId = await createChat({ title: 'New Project' });
      onChatSelect(chatId, { _id: chatId, title: 'New Project', createdAt: Date.now(), updatedAt: Date.now() });
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/zapdev-logo.jpg"
                    alt="ZapDev"
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Chat History
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* New Chat Button */}
              <button
                onClick={handleNewChat}
                className="w-full mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                New Chat
              </button>

              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Delete Selected Button */}
              {selectedChats.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="w-full mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : `Delete ${selectedChats.size} chat${selectedChats.size > 1 ? 's' : ''}`}
                </button>
              )}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {Object.entries(groupedChats).map(([group, groupChats]) => {
                if (groupChats.length === 0) return null;

                return (
                  <div key={group} className="p-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                      {group}
                    </h3>
                    <div className="space-y-2">
                      {groupChats.map((chat) => (
                        <motion.div
                          key={chat._id}
                          layout
                          className={`relative p-3 rounded-lg border transition-all cursor-pointer group ${
                            currentChatId === chat._id
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                              : selectedChats.has(chat._id)
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                          }`}
                          onClick={(e) => {
                            if (e.ctrlKey || e.metaKey) {
                              // Multi-select with Ctrl/Cmd
                              const newSelected = new Set(selectedChats);
                              if (newSelected.has(chat._id)) {
                                newSelected.delete(chat._id);
                              } else {
                                newSelected.add(chat._id);
                              }
                              setSelectedChats(newSelected);
                            } else {
                              onChatSelect(chat._id, chat);
                            }
                          }}
                        >
                          {/* Chat Preview Image */}
                          {chat.screenshot && (
                            <div className="w-full h-20 mb-2 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700">
                              <Image
                                src={chat.screenshot}
                                alt="Chat preview"
                                width={300}
                                height={80}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {chat.title}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                <FiClock className="w-3 h-3" />
                                {formatDate(chat.updatedAt)}
                              </p>
                              {chat.sandboxUrl && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                                  <FiMessageSquare className="w-3 h-3" />
                                  Has sandbox
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Selection Indicator */}
                          {selectedChats.has(chat._id) && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <FiX className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredChats.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <FiMessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No chats found</p>
                  <p className="text-sm">
                    {searchTerm ? 'Try a different search term' : 'Start a new conversation to see it here'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}