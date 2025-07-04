"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User, RealtimeChannel } from '@supabase/supabase-js';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';
import { useAuth } from './AuthProvider';

interface TypingUser {
  id: string;
  name: string;
  chatId: string;
  timestamp: number;
}

interface RealtimeContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
  
  // Typing indicators
  typingUsers: TypingUser[];
  
  // Methods
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  sendTypingIndicator: (chatId: string, isTyping: boolean) => void;
  
  // Message subscriptions
  subscribeToMessages: (chatId: string, onMessage: (message: any) => void) => () => void;
  subscribeToPresence: (chatId: string, onPresenceChange: (users: User[]) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  reconnectAttempts: 0,
  typingUsers: [],
  connect: async () => {},
  disconnect: () => {},
  subscribeToChat: () => {},
  unsubscribeFromChat: () => {},
  sendTypingIndicator: () => {},
  subscribeToMessages: () => () => {},
  subscribeToPresence: () => () => {},
});

interface RealtimeProviderProps {
  children: ReactNode;
}

const TYPING_TIMEOUT = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000; // Start with 1 second

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user, isConfigured } = useAuth();
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  
  // Track active subscriptions
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const typingTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Supabase client for realtime
  useEffect(() => {
    if (!isConfigured) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) return;

    const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    setSupabase(client);

    return () => {
      // Cleanup all channels on unmount
      channelsRef.current.forEach((channel) => {
        client.removeChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, [isConfigured]);

  // Clear typing indicators on timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => 
        prev.filter(user => now - user.timestamp < TYPING_TIMEOUT)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Connection management
  const connect = useCallback(async () => {
    if (!supabase || !user || isConnecting || isConnected) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Listen for connection state changes
      supabase.realtime.onOpen(() => {
        setIsConnected(true);
        setIsConnecting(false);
        setReconnectAttempts(0);
        setConnectionError(null);
        errorLogger.info(ErrorCategory.GENERAL, 'Realtime connection established');
      });

      supabase.realtime.onClose(() => {
        setIsConnected(false);
        setIsConnecting(false);
        errorLogger.warning(ErrorCategory.GENERAL, 'Realtime connection closed');
        
        // Attempt reconnection if not manually disconnected
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts); // Exponential backoff
          reconnectTimerRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else {
          setConnectionError('Failed to reconnect after maximum attempts');
        }
      });

      supabase.realtime.onError((error: any) => {
        setConnectionError(error.message || 'Realtime connection error');
        setIsConnecting(false);
        errorLogger.error(ErrorCategory.GENERAL, 'Realtime connection error:', error);
      });

      // Connect to realtime
      supabase.realtime.connect();
      
    } catch (error) {
      setIsConnecting(false);
      setConnectionError('Failed to initialize realtime connection');
      errorLogger.error(ErrorCategory.GENERAL, 'Realtime connection failed:', error);
    }
  }, [supabase, user, isConnecting, isConnected, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (!supabase) return;

    // Clear reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Unsubscribe from all channels
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current.clear();

    // Disconnect from realtime
    supabase.realtime.disconnect();
    
    setIsConnected(false);
    setIsConnecting(false);
    setReconnectAttempts(0);
    setConnectionError(null);
    setTypingUsers([]);
    
    errorLogger.info(ErrorCategory.GENERAL, 'Realtime connection disconnected');
  }, [supabase]);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (user && isConfigured) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, isConfigured, connect, disconnect]);

  // Chat-specific subscriptions
  const subscribeToChat = useCallback((chatId: string) => {
    if (!supabase || !user || !isConnected) return;

    const channelName = `chat:${chatId}`;
    
    // Remove existing channel if it exists
    const existingChannel = channelsRef.current.get(channelName);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        errorLogger.info(ErrorCategory.GENERAL, `Presence sync for chat ${chatId}:`, state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: any[] }) => {
        errorLogger.info(ErrorCategory.GENERAL, `User joined chat ${chatId}:`, { key, newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string; leftPresences: any[] }) => {
        errorLogger.info(ErrorCategory.GENERAL, `User left chat ${chatId}:`, { key, leftPresences });
      })
      .on('broadcast', { event: 'typing' }, ({ payload }: { payload: any }) => {
        const { userId, userName, isTyping, timestamp } = payload;
        
        if (userId === user.id) return; // Ignore own typing
        
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.id !== userId || u.chatId !== chatId);
          
          if (isTyping) {
            return [...filtered, {
              id: userId,
              name: userName,
              chatId,
              timestamp: timestamp || Date.now(),
            }];
          }
          
          return filtered;
        });
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          errorLogger.info(ErrorCategory.GENERAL, `Subscribed to chat ${chatId}`);
          
          // Track presence
          channel.track({
            user_id: user.id,
            user_name: user.user_metadata?.name || user.email,
            online_at: new Date().toISOString(),
          });
        } else if (status === 'CHANNEL_ERROR') {
          errorLogger.error(ErrorCategory.GENERAL, `Failed to subscribe to chat ${chatId}`);
        }
      });

    channelsRef.current.set(channelName, channel);
  }, [supabase, user, isConnected]);

  const unsubscribeFromChat = useCallback((chatId: string) => {
    if (!supabase) return;

    const channelName = `chat:${chatId}`;
    const channel = channelsRef.current.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      channelsRef.current.delete(channelName);
      errorLogger.info(ErrorCategory.GENERAL, `Unsubscribed from chat ${chatId}`);
    }

    // Clear typing indicators for this chat
    setTypingUsers(prev => prev.filter(u => u.chatId !== chatId));
  }, [supabase]);

  // Typing indicator
  const sendTypingIndicator = useCallback((chatId: string, isTyping: boolean) => {
    if (!supabase || !user || !isConnected) return;

    const channelName = `chat:${chatId}`;
    const channel = channelsRef.current.get(channelName);
    
    if (!channel) return;

    // Clear existing timer for this chat
    const timerKey = `${user.id}:${chatId}`;
    const existingTimer = typingTimersRef.current.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Send typing indicator
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: user.id,
        userName: user.user_metadata?.name || user.email,
        isTyping,
        timestamp: Date.now(),
      },
    });

    // Auto-stop typing after timeout
    if (isTyping) {
      const timer = setTimeout(() => {
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: user.id,
            userName: user.user_metadata?.name || user.email,
            isTyping: false,
            timestamp: Date.now(),
          },
        });
        typingTimersRef.current.delete(timerKey);
      }, TYPING_TIMEOUT);
      
      typingTimersRef.current.set(timerKey, timer);
    }
  }, [supabase, user, isConnected]);

  // Message subscriptions
  const subscribeToMessages = useCallback((chatId: string, onMessage: (message: any) => void) => {
    if (!supabase || !isConnected) return () => {};

    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
                 (payload: any) => {
           onMessage(payload.new);
         }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, isConnected]);

  // Presence subscriptions
  const subscribeToPresence = useCallback((chatId: string, onPresenceChange: (users: User[]) => void) => {
    if (!supabase || !isConnected) return () => {};

    const channel = supabase
      .channel(`presence:${chatId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        onPresenceChange(users as User[]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, isConnected]);

  const value: RealtimeContextType = {
    isConnected,
    isConnecting,
    connectionError,
    reconnectAttempts,
    typingUsers,
    connect,
    disconnect,
    subscribeToChat,
    unsubscribeFromChat,
    sendTypingIndicator,
    subscribeToMessages,
    subscribeToPresence,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

// Convenience hooks
export const useTypingIndicators = (chatId?: string) => {
  const { typingUsers } = useRealtime();
  
  if (!chatId) return typingUsers;
  
  return typingUsers.filter(user => user.chatId === chatId);
};

export const useRealtimeConnection = () => {
  const { isConnected, isConnecting, connectionError, reconnectAttempts, connect, disconnect } = useRealtime();
  
  return {
    isConnected,
    isConnecting,
    hasError: !!connectionError,
    error: connectionError,
    reconnectAttempts,
    connect,
    disconnect,
  };
}; 