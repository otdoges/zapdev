'use client';

import { useState, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';

const FREE_PLAN_CONVERSATION_LIMIT = 5;

export function useUsageLimit() {
  const { isSignedIn } = useUser();
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Get chat stats to check usage (handle when Convex is not configured)
  let chatStats;
  try {
    chatStats = useQuery(api.chats.getUserChatStats);
  } catch (error) {
    // Convex not configured
    chatStats = { totalChats: 0, monthlyChats: 0, recentChats: 0 };
  }
  
  const checkUsageLimit = useCallback((action: 'create_conversation' | 'send_message' = 'create_conversation') => {
    if (!isSignedIn || !chatStats) {
      return true; // Allow if not signed in or no data yet
    }

    const currentUsage = chatStats.totalChats;
    
    // For free users, check conversation limit
    if (action === 'create_conversation' && currentUsage >= FREE_PLAN_CONVERSATION_LIMIT) {
      setShowLimitModal(true);
      return false;
    }

    return true;
  }, [isSignedIn, chatStats]);

  const handleLimitReached = useCallback(() => {
    setShowLimitModal(true);
  }, []);

  const closeLimitModal = useCallback(() => {
    setShowLimitModal(false);
  }, []);

  return {
    canCreateConversation: chatStats ? chatStats.totalChats < FREE_PLAN_CONVERSATION_LIMIT : true,
    currentUsage: chatStats?.totalChats || 0,
    limit: FREE_PLAN_CONVERSATION_LIMIT,
    showLimitModal,
    checkUsageLimit,
    handleLimitReached,
    closeLimitModal,
    chatStats
  };
}