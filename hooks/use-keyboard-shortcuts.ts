import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/lib/stores/chat-store';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts?: KeyboardShortcut[]) {
  const router = useRouter();
  const { resetChat, setMessages } = useChatStore();

  // Default shortcuts
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrl: true,
      description: 'Open command palette',
      action: () => {
        // TODO: Implement command palette
        console.log('Command palette triggered');
      },
    },
    {
      key: '/',
      ctrl: true,
      description: 'Focus chat input',
      action: () => {
        const input = document.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
        input?.focus();
      },
    },
    {
      key: 'n',
      ctrl: true,
      description: 'New chat',
      action: () => {
        resetChat();
        router.push('/chat');
      },
    },
    {
      key: 'l',
      ctrl: true,
      shift: true,
      description: 'Clear chat messages',
      action: () => {
        if (window.confirm('Are you sure you want to clear all messages?')) {
          setMessages([]);
        }
      },
    },
    {
      key: 'h',
      alt: true,
      description: 'Go home',
      action: () => router.push('/'),
    },
    {
      key: 'c',
      alt: true,
      description: 'Go to chat',
      action: () => router.push('/chat'),
    },
    {
      key: 'p',
      alt: true,
      description: 'Go to pricing',
      action: () => router.push('/pricing'),
    },
    {
      key: 'Escape',
      description: 'Close modals/dialogs',
      action: () => {
        // Close any open modals
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          const closeButton = modal.querySelector<HTMLButtonElement>('[aria-label="Close"]');
          closeButton?.click();
        }
      },
    },
  ];

  const allShortcuts = [...defaultShortcuts, ...(shortcuts || [])];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Exception for Escape key
        if (e.key !== 'Escape') {
          return;
        }
      }

      // Find matching shortcut
      const shortcut = allShortcuts.find((s) => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = s.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = s.alt ? e.altKey : !e.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allShortcuts, router, resetChat, setMessages]);

  return allShortcuts;
}

// Hook to display available shortcuts
export function useShortcutHelp() {
  const shortcuts = useKeyboardShortcuts();

  const getShortcutDisplay = (shortcut: KeyboardShortcut) => {
    const keys = [];
    if (shortcut.ctrl) keys.push('Ctrl');
    if (shortcut.shift) keys.push('Shift');
    if (shortcut.alt) keys.push('Alt');
    keys.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key);

    return keys.join(' + ');
  };

  return shortcuts.map((s) => ({
    keys: getShortcutDisplay(s),
    description: s.description,
  }));
}
