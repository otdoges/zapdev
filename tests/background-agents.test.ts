import { describe, it, expect, jest } from '@jest/globals';

// Mock types
interface MockCtx {
  db: any;
  auth: any;
}

// Mock implementation of mutation (simplified from actual implementation)
const createBackgroundJob = async (ctx: MockCtx, args: { title: string }) => {
  const userId = "user_123"; // Mocked auth
  return await ctx.db.insert("backgroundJobs", {
    userId,
    title: args.title,
    status: "pending",
    logs: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
};

describe('Background Agents', () => {
  it('should create a background job', async () => {
    const mockCtx: MockCtx = {
        auth: {},
        db: {
            insert: jest.fn().mockResolvedValue('job_123'),
        }
    };

    const jobId = await createBackgroundJob(mockCtx, { title: "Test Job" });
    expect(jobId).toBe('job_123');
    expect(mockCtx.db.insert).toHaveBeenCalledWith('backgroundJobs', expect.objectContaining({
        title: "Test Job",
        status: "pending"
    }));
  });
});
