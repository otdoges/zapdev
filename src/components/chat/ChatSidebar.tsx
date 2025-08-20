import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Trash2, Zap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Chat {
  _id: string;
  title: string;
  updatedAt: number;
}

interface User {
  avatarUrl?: string;
  email?: string;
  fullName?: string;
}

interface ChatSidebarProps {
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  chats: Chat[];
  selectedChatId: string | null;
  startNewChat: () => void;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  formatTimestamp: (timestamp: number) => string;
  user: User | null;
  modelId: string;
  onChangeModel: (modelId: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = memo(({ 
  sidebarExpanded,
  setSidebarExpanded,
  chats,
  selectedChatId,
  startNewChat,
  selectChat,
  deleteChat,
  formatTimestamp,
  user,
  modelId,
  onChangeModel
}) => {
  return (
    <motion.div
      onMouseEnter={() => setSidebarExpanded(true)}
      onMouseLeave={() => setSidebarExpanded(false)}
      className={`${
        sidebarExpanded ? 'w-80' : 'w-14'
      } bg-gradient-to-b from-gray-900/95 to-black/90 backdrop-blur-2xl border-r border-white/10 hover:border-white/20 flex flex-col transition-all duration-300 relative overflow-hidden shadow-2xl`}
      animate={{ width: sidebarExpanded ? 320 : 56 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Premium sidebar header */}
      <div className="p-4 border-b border-white/10">
        <motion.div 
          className="flex items-center gap-3"
          animate={{ opacity: sidebarExpanded ? 1 : 0 }}
          transition={{ delay: sidebarExpanded ? 0.15 : 0, duration: 0.3 }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg border border-blue-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {sidebarExpanded && (
            <motion.div
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-bold text-lg text-gradient-static">ZapDev</h3>
              <p className="text-xs text-muted-foreground/80">AI Development Assistant</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Premium new chat button */}
      <div className="p-4">
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={startNewChat}
            className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white border-0 rounded-xl py-3 shadow-lg hover:shadow-xl transition-all duration-300"
            variant="ghost"
          >
            <Plus className="w-5 h-5" />
            {sidebarExpanded && (
              <motion.span 
                className="ml-3 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                New Chat
              </motion.span>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Model selector */}
      <div className="px-4 pb-2">
        <Select value={modelId} onValueChange={onChangeModel}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai/gpt-oss-120b">Open GPT 120B (Groq)</SelectItem>
            <SelectItem value="openai/gpt-oss-20b">Open GPT 20B (Groq)</SelectItem>
            <SelectItem value="qwen/qwen3-coder:free">Qwen3 Coder (OpenRouter)</SelectItem>
            <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash</SelectItem>
            <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chat list */}
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-3 space-y-2">
          {Array.isArray(chats) && chats.map((chat, index) => (
            <motion.button
              key={chat._id}
              onClick={() => selectChat(chat._id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`w-full text-left p-4 rounded-xl transition-all duration-300 group relative backdrop-blur-sm border ${
                selectedChatId === chat._id 
                  ? 'bg-gradient-to-r from-blue-600/20 to-blue-700/10 border-blue-500/30 shadow-lg' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selectedChatId === chat._id 
                    ? 'bg-blue-600/30 border border-blue-500/40' 
                    : 'bg-gray-700/50 border border-gray-600/30'
                }`}>
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                {sidebarExpanded && (
                  <motion.div 
                    className="min-w-0 flex-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="font-semibold truncate text-sm mb-1">
                      {chat.title}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {formatTimestamp(chat.updatedAt)}
                    </p>
                  </motion.div>
                )}
              </div>
              
              {sidebarExpanded && (
                <motion.div
                  className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat._id);
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-all duration-200"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </ScrollArea>

      {/* Sidebar footer */}
      {sidebarExpanded && (
        <motion.div 
          className="p-4 border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600/30 to-blue-700/20 flex items-center justify-center border border-blue-500/20">
              <span className="text-xs font-semibold text-blue-300">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.fullName || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});