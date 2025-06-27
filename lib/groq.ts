// Legacy compatibility file - re-exports from modular Groq implementation
// This file maintains backwards compatibility while using the new modular structure

export * from './groq/index';

// Note: The original 492-line file has been refactored into smaller, focused modules:
// - lib/groq/models.ts - Model configurations and selection
// - lib/groq/token-tracking.ts - Token usage tracking
// - lib/groq/provider.ts - Provider setup and client initialization
// - lib/groq/responses.ts - Response generation functions
// - lib/groq/index.ts - Main exports
//
// Whisper transcription functionality has been removed as requested.
