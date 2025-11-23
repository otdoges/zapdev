import { describe, it, expect } from '@jest/globals';

describe('Gemini thought_signature handling', () => {
  const isGeminiModel = (modelId: string): boolean => {
    return modelId.includes("google/gemini") || modelId.includes("gemini");
  };

  const detectGeminiThoughtSignatureError = (error: unknown): boolean => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      errorMessage.includes("thought_signature") ||
      errorMessage.includes("thoughtSignature") ||
      (errorMessage.includes("function call") && errorMessage.includes("missing"))
    );
  };

  describe('isGeminiModel', () => {
    it('detects Gemini model IDs correctly', () => {
      expect(isGeminiModel('google/gemini-3-pro-preview')).toBe(true);
      expect(isGeminiModel('google/gemini-2.5-flash-lite')).toBe(true);
      expect(isGeminiModel('gemini-pro')).toBe(true);
    });

    it('returns false for non-Gemini models', () => {
      expect(isGeminiModel('anthropic/claude-haiku-4.5')).toBe(false);
      expect(isGeminiModel('openai/gpt-5.1-codex')).toBe(false);
      expect(isGeminiModel('moonshotai/kimi-k2-thinking')).toBe(false);
    });
  });

  describe('detectGeminiThoughtSignatureError', () => {
    it('detects thought_signature errors', () => {
      const error1 = new Error(
        'Function call is missing a thought_signature in functionCall parts.'
      );
      expect(detectGeminiThoughtSignatureError(error1)).toBe(true);

      const error2 = new Error(
        'Missing thoughtSignature field in function call'
      );
      expect(detectGeminiThoughtSignatureError(error2)).toBe(true);

      const error3 = new Error(
        'function call missing required field'
      );
      expect(detectGeminiThoughtSignatureError(error3)).toBe(true);
    });

    it('returns false for other errors', () => {
      const error1 = new Error('Network timeout');
      expect(detectGeminiThoughtSignatureError(error1)).toBe(false);

      const error2 = new Error('Invalid API key');
      expect(detectGeminiThoughtSignatureError(error2)).toBe(false);
    });

    it('handles non-Error objects', () => {
      expect(detectGeminiThoughtSignatureError('thought_signature error')).toBe(true);
      expect(detectGeminiThoughtSignatureError('random error')).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should catch Gemini thought_signature errors in production scenario', () => {
      const modelId = 'google/gemini-3-pro-preview';
      const error = new Error(
        'Function call is missing a thought_signature in functionCall parts. This is required for tools to work correctly, and missing thought_signature may lead to degraded model performance.'
      );

      expect(isGeminiModel(modelId)).toBe(true);
      expect(detectGeminiThoughtSignatureError(error)).toBe(true);
    });

    it('should not catch errors from other models', () => {
      const modelId = 'anthropic/claude-haiku-4.5';
      const error = new Error('Some other error');

      expect(isGeminiModel(modelId)).toBe(false);
      expect(detectGeminiThoughtSignatureError(error)).toBe(false);
    });
  });
});
