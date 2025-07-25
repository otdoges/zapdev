// import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from '../router';

// TODO: Install vitest properly and uncomment this test suite

/*
// Mock the E2B service
vi.mock('../../../src/lib/e2b-service', () => ({
  e2bService: {
    executeCode: vi.fn(),
    createFile: vi.fn(),
    readFile: vi.fn(),
    listFiles: vi.fn(),
    deleteFile: vi.fn(),
    cleanup: vi.fn(),
    getStatus: vi.fn(),
  }
}));

describe('E2B tRPC Router', () => {
  const mockContext = {
    authToken: 'test-token',
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeCode', () => {
    it('should require authentication', async () => {
      const caller = appRouter.createCaller({});

      await expect(
        caller.e2b.executeCode({
          code: 'console.log("hello")',
          language: 'javascript',
        })
      ).rejects.toThrow('UNAUTHORIZED');
    });

    it('should execute code when authenticated', async () => {
      const { e2bService } = await import('../../../src/lib/e2b-service');
      
      (e2bService.executeCode as any).mockResolvedValue({
        success: true,
        output: 'hello',
        logs: [],
        files: [],
        executionTime: 100,
      });

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.e2b.executeCode({
        code: 'console.log("hello")',
        language: 'javascript',
      });

      expect(result.success).toBe(true);
      expect(result.output).toBe('hello');
      expect(e2bService.executeCode).toHaveBeenCalledWith(
        'console.log("hello")',
        {
          language: 'javascript',
          timeout: 30000,
          installPackages: undefined,
        }
      );
    });
  });

  describe('createFile', () => {
    it('should create file when authenticated', async () => {
      const { e2bService } = await import('../../../src/lib/e2b-service');
      
      (e2bService.createFile as any).mockResolvedValue(true);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.e2b.createFile({
        path: 'test.txt',
        content: 'Hello World',
      });

      expect(result.success).toBe(true);
      expect(e2bService.createFile).toHaveBeenCalledWith('test.txt', 'Hello World');
    });

    it('should handle file creation failure', async () => {
      const { e2bService } = await import('../../../src/lib/e2b-service');
      
      (e2bService.createFile as any).mockResolvedValue(false);

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.e2b.createFile({
          path: 'test.txt',
          content: 'Hello World',
        })
      ).rejects.toThrow('Failed to create file');
    });
  });

  describe('readFile', () => {
    it('should read file when authenticated', async () => {
      const { e2bService } = await import('../../../src/lib/e2b-service');
      
      (e2bService.readFile as any).mockResolvedValue('File content');

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.e2b.readFile({
        path: 'test.txt',
      });

      expect(result.content).toBe('File content');
      expect(e2bService.readFile).toHaveBeenCalledWith('test.txt');
    });

    it('should handle file not found', async () => {
      const { e2bService } = await import('../../../src/lib/e2b-service');
      
      (e2bService.readFile as any).mockResolvedValue(null);

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.e2b.readFile({
          path: 'non-existent.txt',
        })
      ).rejects.toThrow('File not found or could not be read');
    });
  });

  describe('listFiles', () => {
    it('should list files when authenticated', async () => {
      const { e2bService } = await import('../../../src/lib/e2b-service');
      
      (e2bService.listFiles as any).mockResolvedValue(['file1.txt', 'file2.js']);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.e2b.listFiles({
        directory: '.',
      });

      expect(result.files).toEqual(['file1.txt', 'file2.js']);
      expect(e2bService.listFiles).toHaveBeenCalledWith('.');
    });

    it('should use default directory when not specified', async () => {
      const { e2bService } = await import('../../../src/lib/e2b-service');
      
      (e2bService.listFiles as any).mockResolvedValue([]);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.e2b.listFiles({});

      expect(result.files).toEqual([]);
      expect(e2bService.listFiles).toHaveBeenCalledWith('.');
    });
  });

  describe('installPackage', () => {
    it('should install package when authenticated', async () => {
      const { e2bService } = await import('../../../src/lib/e2b-service');
      
      const mockResult = {
        success: true,
        output: 'Package installed successfully',
        logs: [],
        files: [],
        executionTime: 5000,
      };
      
      (e2bService.installPackage as any).mockResolvedValue(mockResult);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.e2b.installPackage({
        packageName: 'typescript',
        language: 'node',
      });

      expect(result).toEqual(mockResult);
      expect(e2bService.installPackage).toHaveBeenCalledWith('typescript', 'node');
    });
  });

  describe('getStatus', () => {
    it('should return service status when authenticated', async () => {
      const { e2bService } = await import('../../../src/lib/e2b-service');
      
      const mockStatus = {
        available: true,
        metrics: {
          executionsCount: 5,
          totalExecutionTime: 1000,
          errorCount: 0,
        },
        averageExecutionTime: 200,
        errorRate: 0,
      };
      
      (e2bService.getStatus as any).mockReturnValue(mockStatus);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.e2b.getStatus();

      expect(result).toEqual(mockStatus);
      expect(e2bService.getStatus).toHaveBeenCalled();
    });
  });
}); 
*/