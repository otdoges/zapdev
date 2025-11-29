export const createGateway = jest.fn(() => {
  return jest.fn((modelId: string) => ({
    modelId,
    provider: "mock-gateway",
  }));
});
