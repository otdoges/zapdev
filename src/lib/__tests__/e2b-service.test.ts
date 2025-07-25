import { describe, it, expect, beforeEach, vi } from 'vitest';
import { e2bService } from '../e2b-service';

// Mock the E2B SDK
vi.mock('@e2b/code-interpreter', () => ({
  Sandbox: {
    create: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock environment variables
const originalEnv = process.env;

describe('E2BService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isAvailable', () => {
    it('should return true when E2B_API_KEY is set', () => {
      process.env.E2B_API_KEY = 'test-key';
      expect(e2bService.isAvailable()).toBe(true);
    });

    it('should return false when E2B_API_KEY is not set', () => {
      delete process.env.E2B_API_KEY;
      expect(e2bService.isAvailable()).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return service status with metrics', () => {
      const status = e2bService.getStatus();
      
      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('metrics');
      expect(status).toHaveProperty('averageExecutionTime');
      expect(status).toHaveProperty('errorRate');
    });

    it('should calculate error rate correctly', () => {
      // Reset metrics first
      e2bService.resetMetrics();
      const status = e2bService.getStatus();
      
      expect(status.errorRate).toBe(0);
      expect(status.averageExecutionTime).toBe(0);
    });
  });

  describe('executeCode', () => {
    it('should return error when API key is not available', async () => {
      delete process.env.E2B_API_KEY;
      
      const result = await e2bService.executeCode('console.log("hello")');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('E2B API key not configured');
    });

    it('should track events in localStorage', async () => {
      delete process.env.E2B_API_KEY;
      
      await e2bService.executeCode('console.log("hello")');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pendingUsageEvents',
        expect.stringContaining('e2b_code_execution')
      );
    });
  });

  describe('resetMetrics', () => {
    it('should reset all metrics to zero', () => {
      e2bService.resetMetrics();
      const status = e2bService.getStatus();
      
      expect(status.metrics.executionsCount).toBe(0);
      expect(status.metrics.totalExecutionTime).toBe(0);
      expect(status.metrics.errorCount).toBe(0);
      expect(status.metrics.lastExecution).toBeUndefined();
    });
  });

  describe('file operations', () => {
    it('should return false when creating file without API key', async () => {
      delete process.env.E2B_API_KEY;
      
      const result = await e2bService.createFile('test.txt', 'content');
      
      expect(result).toBe(false);
    });

    it('should return null when reading file without API key', async () => {
      delete process.env.E2B_API_KEY;
      
      const result = await e2bService.readFile('test.txt');
      
      expect(result).toBeNull();
    });

    it('should return empty array when listing files without API key', async () => {
      delete process.env.E2B_API_KEY;
      
      const result = await e2bService.listFiles();
      
      expect(result).toEqual([]);
    });
  });

  describe('installPackage', () => {
    it('should track package installation events', async () => {
      delete process.env.E2B_API_KEY;
      
      await e2bService.installPackage('typescript', 'node');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pendingUsageEvents',
        expect.stringContaining('e2b_package_installation')
      );
    });
  });
}); 