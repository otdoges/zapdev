"use client"

import React from 'react'

export default function TypingIndicator() {
  return (
    <div className="flex space-x-1 items-center">
      <div className="flex space-x-1">
        <div 
          className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <div 
          className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <div 
          className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="text-xs text-white/60 ml-2">Thinking...</span>
    </div>
  )
} 