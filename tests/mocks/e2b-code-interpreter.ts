export class Sandbox {
  sandboxId: string;
  startedAt: number;
  state: string;
  files: { read: (path: string) => Promise<string>; write: (path: string, content: string) => Promise<void>; list: () => Promise<string[]> };
  commands: { run: (cmd: string) => Promise<{ stdout: string; stderr: string }> };

  constructor() {
    this.sandboxId = 'mock-sandbox';
    this.startedAt = Date.now();
    this.state = 'running';
    this.files = {
      read: async () => '',
      write: async () => undefined,
      list: async () => [],
    };
    this.commands = {
      run: async () => ({ stdout: '', stderr: '' }),
    };
  }

  static async create() {
    return new Sandbox();
  }

  static async list() {
    return [];
  }

  static async kill() {
    return;
  }

  async getHost() {
    return 'localhost';
  }
}
