import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  createdAt?: Date;
  status?: 'sending' | 'sent' | 'failed';
  retryCount?: number;
}

export interface ChatState {
  // Current chat state
  chatId: string | null;
  supabaseChatId: string | null;
  messages: Message[];
  isTyping: boolean;
  isLoadingMessages: boolean;

  // Input state
  inputValue: string;
  attachments: string[];

  // UI state
  showCommandPalette: boolean;
  activeSuggestion: number;
  inputFocused: boolean;
  showReasoning: boolean;

  // Model configuration
  selectedModel: string;
  useReasoning: boolean;
  reasoningFormat: 'parsed' | 'hidden' | 'raw';
  useMultipleModels: boolean;

  // Progress states
  showBuildingProgress: boolean;
  showCodeGeneration: boolean;
  currentBuildStep: string;
  isBuilding: boolean;

  // Actions
  setChatId: (chatId: string | null) => void;
  setSupabaseChatId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  retryMessage: (id: string) => void;

  setIsTyping: (typing: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;

  setInputValue: (value: string) => void;
  setAttachments: (attachments: string[]) => void;
  addAttachment: (attachment: string) => void;
  removeAttachment: (index: number) => void;

  setShowCommandPalette: (show: boolean) => void;
  setActiveSuggestion: (index: number) => void;
  setInputFocused: (focused: boolean) => void;
  setShowReasoning: (show: boolean) => void;

  setSelectedModel: (model: string) => void;
  setUseReasoning: (use: boolean) => void;
  setReasoningFormat: (format: 'parsed' | 'hidden' | 'raw') => void;
  setUseMultipleModels: (use: boolean) => void;

  setBuildingProgress: (show: boolean) => void;
  setCodeGeneration: (show: boolean) => void;
  setCurrentBuildStep: (step: string) => void;
  setIsBuilding: (building: boolean) => void;

  // Reset state
  resetChat: () => void;
  clearInput: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      chatId: null,
      supabaseChatId: null,
      messages: [],
      isTyping: false,
      isLoadingMessages: false,

      inputValue: '',
      attachments: [],

      showCommandPalette: false,
      activeSuggestion: -1,
      inputFocused: false,
      showReasoning: true,

      selectedModel: 'deepseek-r1-distill-qwen-32b',
      useReasoning: true,
      reasoningFormat: 'parsed',
      useMultipleModels: false,

      showBuildingProgress: false,
      showCodeGeneration: false,
      currentBuildStep: 'analyze',
      isBuilding: false,

      // Actions
      setChatId: (chatId) => set({ chatId }),
      setSupabaseChatId: (id) => set({ supabaseChatId: id }),

      setMessages: (messages) => set({ messages }),
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)),
        })),
      removeMessage: (id) =>
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== id),
        })),
      retryMessage: (id) => {
        const state = get();
        const message = state.messages.find((msg) => msg.id === id);
        if (message && message.status === 'failed') {
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === id
                ? { ...msg, status: 'sending', retryCount: (msg.retryCount || 0) + 1 }
                : msg
            ),
          }));
        }
      },

      setIsTyping: (isTyping) => set({ isTyping }),
      setIsLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),

      setInputValue: (inputValue) => set({ inputValue }),
      setAttachments: (attachments) => set({ attachments }),
      addAttachment: (attachment) =>
        set((state) => ({
          attachments: [...state.attachments, attachment],
        })),
      removeAttachment: (index) =>
        set((state) => ({
          attachments: state.attachments.filter((_, i) => i !== index),
        })),

      setShowCommandPalette: (showCommandPalette) => set({ showCommandPalette }),
      setActiveSuggestion: (activeSuggestion) => set({ activeSuggestion }),
      setInputFocused: (inputFocused) => set({ inputFocused }),
      setShowReasoning: (showReasoning) => set({ showReasoning }),

      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setUseReasoning: (useReasoning) => set({ useReasoning }),
      setReasoningFormat: (reasoningFormat) => set({ reasoningFormat }),
      setUseMultipleModels: (useMultipleModels) => set({ useMultipleModels }),

      setBuildingProgress: (showBuildingProgress) => set({ showBuildingProgress }),
      setCodeGeneration: (showCodeGeneration) => set({ showCodeGeneration }),
      setCurrentBuildStep: (currentBuildStep) => set({ currentBuildStep }),
      setIsBuilding: (isBuilding) => set({ isBuilding }),

      resetChat: () =>
        set({
          chatId: null,
          supabaseChatId: null,
          messages: [],
          isTyping: false,
          isLoadingMessages: false,
          inputValue: '',
          attachments: [],
          showBuildingProgress: false,
          showCodeGeneration: false,
          isBuilding: false,
        }),

      clearInput: () =>
        set({
          inputValue: '',
          attachments: [],
          showCommandPalette: false,
          activeSuggestion: -1,
        }),
    }),
    {
      name: 'zapdev-chat-storage',
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        useReasoning: state.useReasoning,
        reasoningFormat: state.reasoningFormat,
        useMultipleModels: state.useMultipleModels,
        showReasoning: state.showReasoning,
      }),
    }
  )
);
