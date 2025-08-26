import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  User, 
  Bot, 
  Plus, 
  MessageSquare, 
  Trash2,
  Loader2,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { streamAIResponse } from '@/lib/ai';
import { useAuth } from '@/hooks/useAuth';

// Remove unused interfaces and use Convex types directly

const EnhancedChatInterface = () => {
  const { user } = useAuth();
  const [currentChatId, setCurrentChatId] = useState<Id<"chats"> | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convex queries and mutations
  const chats = useQuery(api.chats.getUserChats);
  const messages = useQuery(
    api.messages.getChatMessages,
    currentChatId ? { chatId: currentChatId } : "skip"
  );
  const createChat = useMutation(api.chats.createChat);
  const addMessage = useMutation(api.messages.sendMessage);
  const deleteChat = useMutation(api.chats.deleteChat);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (chats?.chats && chats.chats.length > 0 && !currentChatId) {
      setCurrentChatId(chats.chats[0]._id);
    }
  }, [chats, currentChatId]);

  const handleCreateChat = async () => {
    try {
      const newChatId = await createChat({ title: "New Chat" });
      setCurrentChatId(newChatId);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleDeleteChat = async (chatId: Id<"chats">) => {
    try {
      await deleteChat({ chatId });
      if (currentChatId === chatId) {
        setCurrentChatId(chats?.chats && chats.chats.length > 1 ? chats.chats[0]._id : null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      let chatId = currentChatId;
      
      // Create new chat if none exists
      if (!chatId) {
        chatId = await createChat({ title: userInput.slice(0, 50) });
        setCurrentChatId(chatId);
      }

      // Add user message
      await addMessage({
        chatId,
        content: userInput,
        role: 'user',
      });

      // Get AI response
      const previousMessages = messages?.messages || [];
      const conversationHistory = [
        ...previousMessages.map((m: any) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userInput }
      ];

      const response = await streamAIResponse(conversationHistory);

      // Add AI response
      await addMessage({
        chatId,
        content: response,
        role: 'assistant',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      if (currentChatId) {
        await addMessage({
          chatId: currentChatId,
          content: 'Sorry, I encountered an error. Please try again.',
            role: 'assistant',
          });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const currentChat = chats?.chats?.find((chat: any) => chat._id === currentChatId);

    return (
    <div className="flex h-full bg-[#0A0A0A] text-white">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-80 border-r border-white/10 bg-black/20 backdrop-blur-sm"
          >
            <div className="p-4 border-b border-white/10">
              <Button
                onClick={handleCreateChat}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100%-80px)]">
              <div className="p-2 space-y-1">
                {chats?.chats?.map((chat: any) => (
                  <motion.div
                    key={chat._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: 4 }}
                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      currentChatId === chat._id
                        ? 'bg-white/10 border border-white/20'
                        : 'hover:bg-white/5'
                    }`}
                    onClick={() => setCurrentChatId(chat._id)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300 truncate">
                        {chat.title}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-red-500/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat._id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {currentChat?.title || 'ZapDev Chat'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />
              Online
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6 max-w-4xl mx-auto">
            {(!messages?.messages || messages.messages.length === 0) && !isLoading && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Bot className="w-10 h-10 text-blue-400" />
        </div>
                <h3 className="text-xl font-semibold mb-3">Welcome to ZapDev Chat</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  Describe any website you'd like to build and I'll help you create it with modern technologies.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Build a landing page",
                    "Create a dashboard",
                    "Design a blog",
                    "Make an e-commerce site"
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-gray-300 hover:bg-white/5"
                      onClick={() => setInput(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
        </div>
      </motion.div>
            )}

            {messages?.messages?.map((message: any, index: number) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-3xl ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                      : 'bg-gradient-to-br from-gray-700 to-gray-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
      </div>
                  
                  <Card className={`p-4 border-white/10 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20'
                      : 'bg-black/40 backdrop-blur-sm'
                  }`}>
                    <div className="prose prose-invert max-w-none">
                      <p className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                        {message.content}
          </p>
        </div>
                    
                    {message.role === 'assistant' && message.content.includes('```') && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-gray-300 hover:bg-white/5"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Run Code
                        </Button>
                      </div>
                    )}
                  </Card>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <Card className="p-4 bg-black/40 backdrop-blur-sm border-white/10">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span className="text-gray-400">Thinking...</span>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe a website you'd like to build..."
                  className="resize-none bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 min-h-[60px] max-h-[120px] pr-12"
                  rows={1}
                />
                <div className="absolute right-3 bottom-3 text-xs text-gray-500">
                  {input.length}/2000
                    </div>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-6"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatInterface;