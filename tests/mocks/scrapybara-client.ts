export const scrapybaraClient = {
  createSandbox: jest.fn().mockResolvedValue({
    id: "mock-sandbox-123",
    status: "running",
    url: "https://stream.scrapybara.com/mock",
    instance: {
      id: "mock-sandbox-123",
      stop: jest.fn(),
      bash: jest.fn().mockResolvedValue({ stdout: "mock output", exitCode: 0 }),
      getStreamUrl: jest.fn().mockResolvedValue({ streamUrl: "https://stream.scrapybara.com/mock" }),
    }
  }),
  getSandbox: jest.fn().mockResolvedValue({
    id: "mock-sandbox-123",
    status: "running",
    url: "https://stream.scrapybara.com/mock",
    instance: {
      id: "mock-sandbox-123",
      stop: jest.fn(),
      bash: jest.fn().mockResolvedValue({ stdout: "mock output", exitCode: 0 }),
      getStreamUrl: jest.fn().mockResolvedValue({ streamUrl: "https://stream.scrapybara.com/mock" }),
    }
  }),
  runCommand: jest.fn().mockResolvedValue({ stdout: "mock output", stderr: "", exitCode: 0 }),
  streamEvents: jest.fn(),
  terminateSandbox: jest.fn().mockResolvedValue(undefined),
};
