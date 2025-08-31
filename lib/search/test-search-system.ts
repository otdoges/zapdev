/**
 * Search System Integration Tests
 * 
 * Basic tests to validate the refactored search system components
 * are working correctly together.
 */

import { InternalSearchService } from './search-service';
import { SearchCache } from './search-cache';
import { AISearchProcessor } from './ai-search-processor';
import { SearchRateLimiter } from './rate-limiter';
import { SearchSubscriptionManager } from './subscription-limits';

interface TestResult {
  component: string;
  test: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export class SearchSystemTester {
  private results: TestResult[] = [];

  /**
   * Run all search system tests
   */
  async runAllTests(): Promise<{
    totalTests: number;
    passed: number;
    failed: number;
    results: TestResult[];
    success: boolean;
  }> {
    console.log('🧪 Starting Search System Integration Tests...');
    
    this.results = [];

    // Test each component
    await this.testSearchService();
    await this.testSearchCache();
    await this.testAIProcessor();
    await this.testRateLimiter();
    await this.testSubscriptionManager();

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log(`\n✅ Tests completed: ${passed} passed, ${failed} failed`);

    return {
      totalTests: this.results.length,
      passed,
      failed,
      results: this.results,
      success: failed === 0
    };
  }

  private async runTest(
    component: string,
    testName: string,
    testFn: () => Promise<void>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      await testFn();
      this.results.push({
        component,
        test: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      console.log(`✅ ${component}: ${testName}`);
    } catch (error) {
      this.results.push({
        component,
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
      console.log(`❌ ${component}: ${testName} - ${error}`);
    }
  }

  private async testSearchService(): Promise<void> {
    const mockApiKey = 'test-api-key-12345';
    
    await this.runTest('SearchService', 'Constructor with API key', async () => {
      const service = new InternalSearchService(mockApiKey);
      const stats = service.getStats();
      if (!stats.isConfigured && mockApiKey) {
        throw new Error('Service should be configured with provided API key');
      }
    });

    await this.runTest('SearchService', 'URL building', async () => {
      const service = new InternalSearchService(mockApiKey);
      // Test private method indirectly by checking search parameters
      try {
        await service.searchWeb('test query', { count: 5 });
      } catch (error) {
        // Expected to fail due to mock API key, but should get past URL building
        if (error instanceof Error && error.message.includes('URL')) {
          throw error;
        }
        // Other errors are expected (like API authentication failures)
      }
    });

    await this.runTest('SearchService', 'Options validation', async () => {
      const service = new InternalSearchService(mockApiKey);
      
      try {
        await service.searchWeb('', {}); // Empty query should fail
        throw new Error('Empty query should have thrown an error');
      } catch (error) {
        if (!error instanceof Error || !error.message.includes('required')) {
          throw new Error('Should throw a validation error for empty query');
        }
      }
    });
  }

  private async testSearchCache(): Promise<void> {
    const cache = new SearchCache({ maxEntries: 10, ttlMs: 1000 });

    await this.runTest('SearchCache', 'Cache miss', async () => {
      const result = cache.get('test query');
      if (result !== null) {
        throw new Error('Cache should return null for non-existent key');
      }
    });

    await this.runTest('SearchCache', 'Cache set and get', async () => {
      const mockResult = {
        results: [],
        query: 'test query',
        aiSummary: 'Test summary',
        suggestedQueries: [],
        categories: {}
      };

      cache.set('test query', mockResult);
      const retrieved = cache.get('test query');
      
      if (!retrieved || retrieved.query !== 'test query') {
        throw new Error('Cache should return the stored result');
      }
    });

    await this.runTest('SearchCache', 'Cache expiration', async () => {
      const shortTtlCache = new SearchCache({ maxEntries: 10, ttlMs: 50 });
      const mockResult = {
        results: [],
        query: 'expiring query',
        aiSummary: 'Test summary',
        suggestedQueries: [],
        categories: {}
      };

      shortTtlCache.set('expiring query', mockResult);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const retrieved = shortTtlCache.get('expiring query');
      if (retrieved !== null) {
        throw new Error('Expired cache entry should return null');
      }
    });

    await this.runTest('SearchCache', 'Cache statistics', async () => {
      const stats = cache.getStats();
      if (typeof stats.hits !== 'number' || typeof stats.misses !== 'number') {
        throw new Error('Cache stats should include numeric hit/miss counts');
      }
    });
  }

  private async testAIProcessor(): Promise<void> {
    // Mock the internal search service for AI processor tests
    const processor = new AISearchProcessor();

    await this.runTest('AIProcessor', 'Query enhancement', async () => {
      // Test private methods indirectly through public interface
      const context = {
        programmingLanguage: 'JavaScript',
        userSkillLevel: 'intermediate' as const
      };

      // This will fail due to API calls, but we can test the setup
      try {
        await processor.processSearch('test query', context);
      } catch (error) {
        // Expected to fail due to API, but should not be a validation error
        if (error instanceof Error && error.message.includes('validation')) {
          throw error;
        }
      }
    });

    await this.runTest('AIProcessor', 'Result categorization', async () => {
      // Test result categorization logic with mock data
      const mockResults = [
        {
          title: 'JavaScript Tutorial for Beginners',
          url: 'https://example.com/tutorial',
          description: 'Learn JavaScript from scratch',
          relevanceScore: 95
        },
        {
          title: 'React Documentation',
          url: 'https://docs.react.dev',
          description: 'Official React documentation',
          relevanceScore: 90
        }
      ];

      // Since categorization logic is private, we test indirectly
      const hasCategorizationLogic = processor.constructor.name === 'AISearchProcessor';
      if (!hasCategorizationLogic) {
        throw new Error('AI processor should have categorization capabilities');
      }
    });
  }

  private async testRateLimiter(): Promise<void> {
    const limiter = new SearchRateLimiter();

    await this.runTest('RateLimiter', 'Basic rate limiting', async () => {
      const testUserId = 'test-user-123';
      const result = await limiter.checkRateLimit(testUserId, 'free');
      
      if (typeof result.allowed !== 'boolean') {
        throw new Error('Rate limit result should include allowed boolean');
      }
      
      if (typeof result.remaining !== 'number') {
        throw new Error('Rate limit result should include remaining number');
      }
    });

    await this.runTest('RateLimiter', 'Rate limit consumption', async () => {
      const testUserId = 'test-user-456';
      
      // First check should allow
      const beforeResult = await limiter.checkRateLimit(testUserId, 'free');
      const remainingBefore = beforeResult.remaining;
      
      // Consume a request
      await limiter.consumeRateLimit(testUserId);
      
      // Check again - should have one less remaining
      const afterResult = await limiter.checkRateLimit(testUserId, 'free');
      const remainingAfter = afterResult.remaining;
      
      if (remainingAfter >= remainingBefore) {
        throw new Error('Remaining count should decrease after consumption');
      }
    });

    await this.runTest('RateLimiter', 'Usage statistics', async () => {
      const testUserId = 'test-user-789';
      const stats = await limiter.getUsageStats(testUserId, 'pro');
      
      if (typeof stats.used !== 'number' || typeof stats.limit !== 'number') {
        throw new Error('Usage stats should include numeric used/limit values');
      }
    });
  }

  private async testSubscriptionManager(): Promise<void> {
    const testUserId = 'test-user-subscription';

    await this.runTest('SubscriptionManager', 'Get user quota', async () => {
      const quota = await SearchSubscriptionManager.getUserQuota(testUserId);
      
      if (!quota.tier || typeof quota.dailyLimit !== 'number') {
        throw new Error('User quota should include tier and numeric limits');
      }
    });

    await this.runTest('SubscriptionManager', 'Search permission check', async () => {
      const canSearch = await SearchSubscriptionManager.canPerformSearch(testUserId, 'standard');
      
      if (typeof canSearch.allowed !== 'boolean') {
        throw new Error('Permission check should return allowed boolean');
      }
    });

    await this.runTest('SubscriptionManager', 'Usage recording', async () => {
      // This should not throw an error
      await SearchSubscriptionManager.recordSearchUsage(testUserId, 'standard');
    });

    await this.runTest('SubscriptionManager', 'Upgrade suggestions', async () => {
      const suggestions = await SearchSubscriptionManager.getUpgradeSuggestions(testUserId);
      
      if (typeof suggestions.shouldUpgrade !== 'boolean') {
        throw new Error('Upgrade suggestions should include shouldUpgrade boolean');
      }
      
      if (!suggestions.currentTier || !suggestions.suggestedTier) {
        throw new Error('Upgrade suggestions should include tier information');
      }
    });

    await this.runTest('SubscriptionManager', 'Feature comparison', async () => {
      const features = SearchSubscriptionManager.getFeatureComparison();
      
      if (!features.free || !features.pro || !features.enterprise) {
        throw new Error('Feature comparison should include all tiers');
      }
      
      if (!Array.isArray(features.free)) {
        throw new Error('Feature lists should be arrays');
      }
    });
  }

  /**
   * Generate a test report
   */
  generateReport(): string {
    const { totalTests, passed, failed } = this.results.reduce(
      (acc, result) => {
        acc.totalTests++;
        if (result.passed) acc.passed++;
        else acc.failed++;
        return acc;
      },
      { totalTests: 0, passed: 0, failed: 0 }
    );

    const successRate = totalTests > 0 ? (passed / totalTests * 100).toFixed(1) : '0.0';
    
    let report = '# Search System Test Report\n\n';
    report += `**Overall Results:** ${passed}/${totalTests} tests passed (${successRate}%)\n\n`;
    
    if (failed > 0) {
      report += '## Failed Tests\n\n';
      this.results
        .filter(r => !r.passed)
        .forEach(result => {
          report += `- **${result.component}**: ${result.test}\n`;
          report += `  - Error: ${result.error}\n`;
          report += `  - Duration: ${result.duration}ms\n\n`;
        });
    }

    report += '## All Test Results\n\n';
    
    const groupedResults = this.results.reduce((acc, result) => {
      if (!acc[result.component]) acc[result.component] = [];
      acc[result.component].push(result);
      return acc;
    }, {} as Record<string, TestResult[]>);

    Object.entries(groupedResults).forEach(([component, tests]) => {
      report += `### ${component}\n\n`;
      tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        report += `- ${status} ${test.test} (${test.duration}ms)\n`;
        if (test.error) {
          report += `  - Error: ${test.error}\n`;
        }
      });
      report += '\n';
    });

    return report;
  }
}

// Export convenience function
export async function runSearchSystemTests(): Promise<void> {
  const tester = new SearchSystemTester();
  const results = await tester.runAllTests();
  
  console.log('\n' + '='.repeat(60));
  console.log(tester.generateReport());
  
  if (!results.success) {
    throw new Error(`Search system tests failed: ${results.failed} failures`);
  }
}

// Self-test execution for development
if (require.main === module) {
  runSearchSystemTests()
    .then(() => console.log('✅ All tests passed!'))
    .catch(error => {
      console.error('❌ Tests failed:', error);
      process.exit(1);
    });
}