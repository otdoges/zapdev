import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { Message } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'

// Query keys factory for consistent cache management
export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (filters?: any) => [...chatKeys.lists(), filters] as const,
  details: () => [...chatKeys.all, 'detail'] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
  messages: (chatId: string) => [...chatKeys.detail(chatId), 'messages'] as const,
  messagePage: (chatId: string, page: number) => [...chatKeys.messages(chatId), { page }] as const,
}

interface ChatMessagesResponse {
  messages: Message[]
  nextCursor?: string
  hasMore: boolean
  totalCount: number
}

interface SendMessagePayload {
  chatId: string
  message: string
  model?: string
}

// Hook for fetching paginated chat messages
export function useChatMessages(chatId: string, pageSize: number = 50) {
  return useInfiniteQuery<ChatMessagesResponse, Error, ChatMessagesResponse>({
    queryKey: chatKeys.messages(chatId),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        chatId,
        pageSize: pageSize.toString(),
      })
      
      if (pageParam) {
        params.append('cursor', pageParam as string)
      }

      const response = await fetch(`/api/chat/messages?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`)
      }

      return response.json() as Promise<ChatMessagesResponse>
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true,
    enabled: !!chatId && chatId !== 'new',
  })
}

// Hook for fetching all messages (backward compatibility)
export function useAllChatMessages(chatId: string) {
  return useQuery({
    queryKey: chatKeys.detail(chatId),
    queryFn: async () => {
      const response = await fetch(`/api/chat/messages?chatId=${chatId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`)
      }

      const data = await response.json()
      return data.messages as Message[]
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: !!chatId && chatId !== 'new',
  })
}

// Hook for sending messages with optimistic updates
export function useSendMessage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ chatId, message, model }: SendMessagePayload) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: message }], chatId, model }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to send message')
      }

      return response
    },
    onMutate: async ({ chatId, message }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: chatKeys.messages(chatId) })

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(chatKeys.detail(chatId))

      // Optimistically update messages
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: message,
        role: 'user',
        created_at: new Date().toISOString(),
        chat_id: chatId,
      }

      queryClient.setQueryData(chatKeys.detail(chatId), (old: Message[] = []) => [
        ...old,
        optimisticMessage,
      ])

      return { previousMessages }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(chatKeys.detail(variables.chatId), context.previousMessages)
      }
      
      toast({
        title: 'Error sending message',
        description: err.message,
        variant: 'destructive',
      })
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.chatId) })
    },
  })
}

// Hook for saving messages
export function useSaveMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (message: Partial<Message>) => {
      const response = await fetch('/api/chat/save-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save message')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch messages
      if (variables.chat_id) {
        queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.chat_id) })
      }
    },
  })
}

// Hook for deleting a message
export function useDeleteMessage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ messageId, chatId }: { messageId: string; chatId: string }) => {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete message')
      }

      return response.json()
    },
    onMutate: async ({ messageId, chatId }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: chatKeys.messages(chatId) })

      // Snapshot and optimistically remove
      const previousMessages = queryClient.getQueryData(chatKeys.detail(chatId))
      
      queryClient.setQueryData(chatKeys.detail(chatId), (old: Message[] = []) => 
        old.filter(msg => msg.id !== messageId)
      )

      return { previousMessages }
    },
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(chatKeys.detail(variables.chatId), context.previousMessages)
      }
      
      toast({
        title: 'Error deleting message',
        description: err.message,
        variant: 'destructive',
      })
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.chatId) })
    },
  })
}

// Hook for updating a message
export function useUpdateMessage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ messageId, content, chatId }: { messageId: string; content: string; chatId: string }) => {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('Failed to update message')
      }

      return response.json()
    },
    onMutate: async ({ messageId, content, chatId }) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.messages(chatId) })

      const previousMessages = queryClient.getQueryData(chatKeys.detail(chatId))
      
      queryClient.setQueryData(chatKeys.detail(chatId), (old: Message[] = []) => 
        old.map(msg => msg.id === messageId ? { ...msg, content } : msg)
      )

      return { previousMessages }
    },
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(chatKeys.detail(variables.chatId), context.previousMessages)
      }
      
      toast({
        title: 'Error updating message',
        description: err.message,
        variant: 'destructive',
      })
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.chatId) })
    },
  })
}

// Hook for prefetching messages
export function usePrefetchMessages(chatId: string) {
  const queryClient = useQueryClient()

  return () => {
    queryClient.prefetchQuery({
      queryKey: chatKeys.detail(chatId),
      queryFn: async () => {
        const response = await fetch(`/api/chat/messages?chatId=${chatId}`)
        if (!response.ok) {
          throw new Error('Failed to prefetch messages')
        }
        const data = await response.json()
        return data.messages as Message[]
      },
      staleTime: 5 * 60 * 1000,
    })
  }
}