import { ReasoningFormat } from './models';

// Token usage tracking for Groq
export interface GroqTokenUsage {
  modelId: string;
  tokensUsed: number;
  timestamp: number;
  requestType: 'stream' | 'generate';
  reasoningFormat?: ReasoningFormat;
}

let dailyGroqTokenUsage: GroqTokenUsage[] = [];
const MAX_DAILY_GROQ_TOKENS = 100000; // Groq has generous free tier limits

// Reset daily usage if it's a new day
function resetGroqDailyUsageIfNeeded() {
  if (typeof window === 'undefined') return; // Server-side check
  
  const now = new Date();
  const today = now.toDateString();
  const lastReset = localStorage?.getItem('groqTokenUsageResetDate');
  
  if (lastReset !== today) {
    dailyGroqTokenUsage = [];
    localStorage?.setItem('groqTokenUsageResetDate', today);
    localStorage?.setItem('dailyGroqTokenUsage', JSON.stringify([]));
  } else {
    // Load existing usage
    const stored = localStorage?.getItem('dailyGroqTokenUsage');
    if (stored) {
      try {
        dailyGroqTokenUsage = JSON.parse(stored);
      } catch (e) {
        dailyGroqTokenUsage = [];
      }
    }
  }
}

// Track Groq token usage
export function trackGroqTokenUsage(
  modelId: string, 
  tokens: number, 
  requestType: 'stream' | 'generate',
  reasoningFormat?: ReasoningFormat
) {
  if (typeof window === 'undefined') return; // Server-side, skip tracking
  
  dailyGroqTokenUsage.push({
    modelId,
    tokensUsed: tokens,
    timestamp: Date.now(),
    requestType,
    reasoningFormat
  });
  
  // Store in localStorage for persistence
  localStorage.setItem('dailyGroqTokenUsage', JSON.stringify(dailyGroqTokenUsage));
}

// Get remaining tokens for the day
export function getRemainingTokens(): number {
  if (typeof window === 'undefined') return MAX_DAILY_GROQ_TOKENS;
  
  resetGroqDailyUsageIfNeeded();
  const totalUsed = dailyGroqTokenUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0);
  return Math.max(0, MAX_DAILY_GROQ_TOKENS - totalUsed);
}

// Get comprehensive token usage statistics
export function getGroqTokenUsageStats() {
  if (typeof window === 'undefined') {
    return {
      used: 0,
      remaining: MAX_DAILY_GROQ_TOKENS,
      percentage: 0,
      maxDaily: MAX_DAILY_GROQ_TOKENS
    };
  }
  
  resetGroqDailyUsageIfNeeded();
  
  const totalUsed = dailyGroqTokenUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0);
  const remaining = Math.max(0, MAX_DAILY_GROQ_TOKENS - totalUsed);
  const percentage = Math.min(100, (totalUsed / MAX_DAILY_GROQ_TOKENS) * 100);
  
  return {
    used: totalUsed,
    remaining,
    percentage,
    maxDaily: MAX_DAILY_GROQ_TOKENS,
    usage: dailyGroqTokenUsage
  };
} 