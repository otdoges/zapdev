export interface WebContainerProps {
  code?: string;
  language?: string;
  isRunning?: boolean;
}

export interface ProjectFile {
  file?: {
    contents: string;
  };
  directory?: {
    [key: string]: ProjectFile;
  };
}

export interface FileStructure {
  [key: string]: ProjectFile;
}

export type WebContainerStatus = "idle" | "installing" | "building" | "running" | "error" | "success";

export interface BrowserCompatibilityResult {
  compatible: boolean;
  reason: string;
} 