import { AIProcessorWithSearch, getAIProcessorWithSearch, processWithSearch, createSearchEnabledTask } from './ai-processor-with-search';
import { getInternalBraveSearch } from '@/lib/search/internal-brave-search';
import type { SearchResponse } from '@/lib/search/search-service';

// Mock the search service
jest.mock('@/lib/search/internal-brave-search');
const mockGetInternalBraveSearch = getInternalBraveSearch as jest.MockedFunction<typeof getInternalBraveSearch>;

// Mock AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn()
}));

// Mock AI provider SDKs
jest.mock('@ai-sdk/groq');
jest.mock('@ai-sdk/anthropic');
jest.mock('@ai-sdk/openai');
jest.mock('@ai-sdk/google');

import { generateText } from 'ai';
const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;

describe('AIProcessorWithSearch', () => {
  const mockSearchService = {
    search: jest.fn(),
    healthCheck: jest.fn(),
    getStats: jest.fn()
  };

  const mockSearchResponse: SearchResponse = {
    results: [
      {
        title: 'React Documentation',
        url: 'https://reactjs.org/docs',
        description: 'Official React documentation',
        type: 'web',
        relevanceScore: 95
      },
      {
        title: 'React Tutorial',
        url: 'https://reactjs.org/tutorial',
        description: 'Learn React step by step',
        type: 'web',
        relevanceScore: 88
      }
    ],
    query: 'React hooks patterns',
    totalResults: 2,
    searchTime: 150
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInternalBraveSearch.mockReturnValue(mockSearchService as any);
    mockSearchService.healthCheck.mockResolvedValue(true);
    mockSearchService.search.mockResolvedValue(mockSearchResponse);
    mockSearchService.getStats.mockReturnValue({
      apiKey: 'test-key',
      baseUrl: 'test-url',
      isConfigured: true
    });

    mockGenerateText.mockResolvedValue({
      text: 'Generated response',
      usage: { totalTokens: 100 }
    } as any);
  });

  describe('AIProcessorWithSearch instantiation', () => {
    it('should create instance successfully', () => {
      const processor = new AIProcessorWithSearch();
      expect(processor).toBeInstanceOf(AIProcessorWithSearch);
    });

    it('should handle search service unavailability gracefully', () => {
      mockSearchService.healthCheck.mockRejectedValue(new Error('Service unavailable'));
      
      expect(() => new AIProcessorWithSearch()).not.toThrow();
    });
  });

  describe('processRequest', () => {
    let processor: AIProcessorWithSearch;

    beforeEach(() => {
      processor = new AIProcessorWithSearch();
    });

    it('should process request without search', async () => {
      const request = {
        prompt: 'Simple question',
        includeSearch: false
      };

      const result = await processor.processRequest(request);

      expect(result.content).toBe('Generated response');
      expect(result.searchResults).toEqual([]);
      expect(result.searchQueries).toEqual([]);
      expect(result.model).toBe('claude-3-5-sonnet-20241022');
      expect(mockSearchService.search).not.toHaveBeenCalled();
    });

    it('should process request with search', async () => {
      const request = {
        prompt: 'How to use React hooks?',
        includeSearch: true
      };

      // Mock query generation
      mockGenerateText
        .mockResolvedValueOnce({ // For query generation
          text: 'React hooks patterns\nReact hooks examples\nReact hooks tutorial'
        } as any)
        .mockResolvedValueOnce({ // For final response
          text: 'React hooks are functions that...',
          usage: { totalTokens: 150 }
        } as any);

      const result = await processor.processRequest(request);

      expect(result.content).toBe('React hooks are functions that...');
      expect(result.searchResults).toHaveLength(2);
      expect(result.searchQueries).toHaveLength(3);
      expect(result.tokensUsed).toBe(150);
    });

    it('should auto-enable search for programming queries', async () => {
      const request = {
        prompt: 'How to fix React error TypeError'
      };

      mockGenerateText
        .mockResolvedValueOnce({ text: 'React error fix\nTypeError solutions' } as any)
        .mockResolvedValueOnce({ text: 'To fix this error...' } as any);

      const result = await processor.processRequest(request);

      expect(mockSearchService.search).toHaveBeenCalled();
      expect(result.searchResults).toHaveLength(2);
    });

    it('should handle search failure gracefully', async () => {
      const request = {
        prompt: 'How to use React?',
        includeSearch: true
      };

      mockSearchService.search.mockRejectedValue(new Error('Search failed'));
      mockGenerateText.mockResolvedValue({
        text: 'Generated without search',
        usage: { totalTokens: 80 }
      } as any);

      const result = await processor.processRequest(request);

      expect(result.content).toBe('Generated without search');
      expect(result.searchResults).toEqual([]);
    });

    it('should use different AI models', async () => {
      const request = {
        prompt: 'Test prompt',
        model: 'gpt-4o' as const
      };

      await processor.processRequest(request);

      expect(result.model).toBe('gpt-4o');
    });

    it('should handle background mode', async () => {
      const request = {
        prompt: 'Background task',
        backgroundMode: true,
        includeSearch: true
      };

      mockGenerateText
        .mockResolvedValueOnce({ text: 'search query' } as any)
        .mockResolvedValueOnce({ text: 'Background response' } as any);

      const result = await processor.processRequest(request);

      expect(result.content).toBe('Background response');
    });
  });

  describe('processBackgroundTasks', () => {
    let processor: AIProcessorWithSearch;

    beforeEach(() => {
      processor = new AIProcessorWithSearch();
    });

    it('should process multiple tasks', async () => {
      const tasks = [
        {
          id: 'task1',
          type: 'research' as const,
          prompt: 'Research React',
          searchEnabled: true,
          status: 'pending' as const,
          createdAt: new Date()
        },
        {
          id: 'task2',
          type: 'code-generation' as const,
          prompt: 'Generate component',
          searchEnabled: false,
          status: 'pending' as const,
          createdAt: new Date()
        }
      ];

      mockGenerateText.mockResolvedValue({
        text: 'Task completed',
        usage: { totalTokens: 50 }
      } as any);

      const results = await processor.processBackgroundTasks(tasks);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('completed');
      expect(results[1].status).toBe('completed');
      expect(results[0].result?.content).toBe('Task completed');
    });

    it('should handle task failures', async () => {
      const tasks = [
        {
          id: 'failing-task',
          type: 'research' as const,
          prompt: 'This will fail',
          searchEnabled: true,
          status: 'pending' as const,
          createdAt: new Date()
        }
      ];

      mockGenerateText.mockRejectedValue(new Error('AI processing failed'));

      const results = await processor.processBackgroundTasks(tasks);

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('error');
      expect(results[0].error).toContain('AI processing failed');
    });
  });

  describe('healthCheck', () => {
    let processor: AIProcessorWithSearch;

    beforeEach(() => {
      processor = new AIProcessorWithSearch();
    });

    it('should return healthy status when all services work', async () => {
      mockGenerateText.mockResolvedValue({ text: 'Hello' } as any);

      const health = await processor.healthCheck();

      expect(health.aiModels).toBe(true);
      expect(health.searchService).toBe(true);
      expect(health.overall).toBe(true);
    });

    it('should return unhealthy status when AI fails', async () => {
      mockGenerateText.mockRejectedValue(new Error('AI failed'));

      const health = await processor.healthCheck();

      expect(health.aiModels).toBe(false);
      expect(health.searchService).toBe(true);
      expect(health.overall).toBe(false);
    });

    it('should return unhealthy status when search fails', async () => {
      mockSearchService.healthCheck.mockResolvedValue(false);
      mockGenerateText.mockResolvedValue({ text: 'Hello' } as any);

      const health = await processor.healthCheck();

      expect(health.aiModels).toBe(true);
      expect(health.searchService).toBe(false);
      expect(health.overall).toBe(false);
    });
  });

  describe('getStats', () => {
    let processor: AIProcessorWithSearch;

    beforeEach(() => {
      processor = new AIProcessorWithSearch();
    });

    it('should return processor statistics', () => {
      const stats = processor.getStats();

      expect(stats.searchServiceStats).toEqual({
        apiKey: 'test-key',
        baseUrl: 'test-url',
        isConfigured: true
      });
      expect(stats.supportedModels).toContain('claude-3-5-sonnet-20241022');
      expect(stats.supportedModels).toContain('gpt-4o');
    });
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInternalBraveSearch.mockReturnValue({
      search: jest.fn().mockResolvedValue({
        results: [],
        query: 'test',
        totalResults: 0,
        searchTime: 100
      }),
      healthCheck: jest.fn().mockResolvedValue(true),
      getStats: jest.fn().mockReturnValue({})
    } as any);
  });

  describe('getAIProcessorWithSearch', () => {
    it('should return singleton instance', () => {
      const processor1 = getAIProcessorWithSearch();
      const processor2 = getAIProcessorWithSearch();

      expect(processor1).toBe(processor2);
      expect(processor1).toBeInstanceOf(AIProcessorWithSearch);
    });
  });

  describe('processWithSearch', () => {
    it('should process prompt with search enabled', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Processed with search',
        usage: { totalTokens: 75 }
      } as any);

      const result = await processWithSearch('Test prompt');

      expect(result.content).toBe('Processed with search');
      expect(result.searchQueries).toBeDefined();
    });
  });

  describe('createSearchEnabledTask', () => {
    it('should create task with default values', async () => {
      const task = await createSearchEnabledTask('Test task');

      expect(task.id).toMatch(/^task-\d+-/);
      expect(task.type).toBe('research');
      expect(task.prompt).toBe('Test task');
      expect(task.searchEnabled).toBe(true);
      expect(task.status).toBe('pending');
      expect(task.createdAt).toBeInstanceOf(Date);
    });

    it('should create task with custom type', async () => {
      const task = await createSearchEnabledTask('Code task', 'code-generation');

      expect(task.type).toBe('code-generation');
      expect(task.prompt).toBe('Code task');
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    mockGetInternalBraveSearch.mockReturnValue({
      search: jest.fn(),
      healthCheck: jest.fn(),
      getStats: jest.fn()
    } as any);
  });

  it('should handle empty prompts', async () => {
    const processor = new AIProcessorWithSearch();
    
    const result = await processor.processRequest({
      prompt: ''
    });

    expect(result.content).toBeDefined();
  });

  it('should handle malformed search responses', async () => {
    const processor = new AIProcessorWithSearch();
    const mockSearch = mockGetInternalBraveSearch().search as jest.Mock;
    
    mockSearch.mockResolvedValue({
      results: null, // Invalid response
      query: 'test'
    });

    mockGenerateText.mockResolvedValue({
      text: 'Generated despite search error'
    } as any);

    const result = await processor.processRequest({
      prompt: 'Test query',
      includeSearch: true
    });

    expect(result.content).toBe('Generated despite search error');
  });

  it('should handle network timeouts gracefully', async () => {
    const processor = new AIProcessorWithSearch();
    const mockSearch = mockGetInternalBraveSearch().search as jest.Mock;
    
    mockSearch.mockRejectedValue(new Error('Network timeout'));
    mockGenerateText.mockResolvedValue({ text: 'Fallback response' } as any);

    const result = await processor.processRequest({
      prompt: 'Test with network issue',
      includeSearch: true
    });

    expect(result.content).toBe('Fallback response');
  });
});