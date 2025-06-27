'use client';

import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1">
      <div className="flex space-x-1">
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-white/60"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-white/60"
          style={{ animationDelay: '150ms' }}
        />
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-white/60"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="ml-2 text-xs text-white/60">Thinking...</span>
    </div>
  );
}
