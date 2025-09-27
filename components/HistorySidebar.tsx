'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { FiSearch, FiTrash2, FiMessageSquare, FiClock, FiPlus } from 'react-icons/fi';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/shadcn/sheet';
import { ScrollArea } from '@/components/ui/shadcn/scroll-area';

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
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="px-4 py-4 border-b">
          <div className="flex items-center gap-3">
            <Image
              src="/zapdev-logo.jpg"
              alt="ZapDev"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <div>
              <SheetTitle>Chat History</SheetTitle>
              <SheetDescription>Recent projects and conversations</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full mb-3 px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            New Chat
          </button>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
            />
          </div>
          {selectedChats.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="w-full mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
            >
              <FiTrash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : `Delete ${selectedChats.size} chat${selectedChats.size > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="pb-6">
            {Object.entries(groupedChats).map(([group, groupChats]) => {
              if (groupChats.length === 0) return null;
              return (
                <div key={group} className="px-4 py-3">
                  <h3 className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">
                    {group}
                  </h3>
                  <div className="space-y-2">
                    {groupChats.map((chat) => (
                      <div
                        key={chat._id}
                        className={`relative p-3 rounded-lg border transition-colors cursor-pointer ${
                          currentChatId === chat._id
                            ? 'bg-zinc-50 border-zinc-300'
                            : selectedChats.has(chat._id)
                              ? 'bg-red-50 border-red-200'
                              : 'bg-white border-zinc-200 hover:bg-zinc-50'
                        }`}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) {
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
                        {chat.screenshot && (
                          <div className="w-full h-20 mb-2 rounded-md overflow-hidden bg-zinc-100">
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
                            <h4 className="font-medium text-zinc-900 truncate">
                              {chat.title}
                            </h4>
                            <p className="text-sm text-zinc-600 flex items-center gap-1 mt-1">
                              <FiClock className="w-3 h-3 text-zinc-500" />
                              {formatDate(chat.updatedAt)}
                            </p>
                            {chat.sandboxUrl && (
                              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <FiMessageSquare className="w-3 h-3" />
                                Has sandbox
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredChats.length === 0 && (
              <div className="px-4 py-8 text-center text-zinc-500">
                <FiMessageSquare className="w-10 h-10 mx-auto mb-3 text-zinc-400" />
                <p className="text-sm">{searchTerm ? 'Try a different search term' : 'Start a new conversation to see it here'}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
