export const cuaClient = {
  createSandbox: jest.fn().mockResolvedValue({ id: "mock-sandbox-123", status: "running" }),
  runCommand: jest.fn().mockResolvedValue({ stdout: "mock output", stderr: "", exitCode: 0 }),
  streamEvents: jest.fn(),
  terminateSandbox: jest.fn().mockResolvedValue(undefined),
};
