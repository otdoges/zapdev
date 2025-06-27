import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export interface FileSystemTree {
  [key: string]: {
    file?: {
      contents: string;
    };
    directory?: FileSystemTree;
  };
}

export class FileManager {
  constructor(private container: any) {}

  async mountFiles(files: FileSystemTree): Promise<void> {
    try {
      await this.container.mount(files as any); // WebContainer API expects this format
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, 'Failed to mount files:', error);
      throw new Error(`Failed to mount files: ${error}`);
    }
  }

  async writeFile(path: string, contents: string): Promise<void> {
    try {
      await this.container.fs.writeFile(path, contents);
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, `Failed to write file ${path}:`, error);
      throw new Error(`Failed to write file ${path}: ${error}`);
    }
  }

  async readFile(path: string): Promise<string> {
    try {
      const contents = await this.container.fs.readFile(path, 'utf-8');
      return contents;
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, `Failed to read file ${path}:`, error);
      throw new Error(`Failed to read file ${path}: ${error}`);
    }
  }

  async createDirectory(path: string): Promise<void> {
    try {
      await this.container.fs.mkdir(path, { recursive: true });
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, `Failed to create directory ${path}:`, error);
      throw new Error(`Failed to create directory ${path}: ${error}`);
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await this.container.fs.stat(path);
      return true;
    } catch {
      return false;
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await this.container.fs.unlink(path);
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, `Failed to delete file ${path}:`, error);
      throw new Error(`Failed to delete file ${path}: ${error}`);
    }
  }

  async listDirectory(path: string = '/'): Promise<string[]> {
    try {
      const entries = await this.container.fs.readdir(path);
      return entries;
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, `Failed to list directory ${path}:`, error);
      throw new Error(`Failed to list directory ${path}: ${error}`);
    }
  }

  async copyFile(source: string, destination: string): Promise<void> {
    try {
      const contents = await this.readFile(source);
      await this.writeFile(destination, contents);
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, `Failed to copy file ${source} to ${destination}:`, error);
      throw new Error(`Failed to copy file ${source} to ${destination}: ${error}`);
    }
  }

  createFileTree(structure: Record<string, string>): FileSystemTree {
    const tree: FileSystemTree = {};

    for (const [path, contents] of Object.entries(structure)) {
      const parts = path.split('/').filter(Boolean);
      let current = tree;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        current = current[part].directory!;
      }

      const filename = parts[parts.length - 1];
      current[filename] = {
        file: { contents },
      };
    }

    return tree;
  }
}