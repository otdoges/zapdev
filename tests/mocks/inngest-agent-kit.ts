export const openai = () => ({
  model: '',
  apiKey: '',
  baseUrl: '',
  defaultParameters: {},
});

export const createAgent = () => ({
  run: async () => ({ output: [] }),
});

export const createTool = () => ({ handler: async () => ({}) });
export const createNetwork = () => ({ run: async () => ({ output: [] }) });
export const createState = () => ({ get: () => ({}), set: () => undefined });

export type Tool = Record<string, unknown>;
export type Message = { type: string; content: unknown };
export type NetworkRun = Record<string, unknown>;
