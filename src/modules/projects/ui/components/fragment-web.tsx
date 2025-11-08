import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ExternalLinkIcon, RefreshCcwIcon, DownloadIcon, BotIcon } from "lucide-react";
import JSZip from "jszip";

import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";
import { filterAIGeneratedFiles } from "@/lib/filter-ai-files";
import { cn } from "@/lib/utils";

interface FragmentWebProps {
  data: Doc<"fragments">;
}

const normalizeFiles = (value: Doc<"fragments">["files"]): Record<string, string> => {
  if (value === null || value === undefined) {
    return {};
  }

  if (typeof value !== "object") {
    console.warn("[FragmentWeb] Files value is not an object:", typeof value, value);
    return {};
  }

  if (Array.isArray(value)) {
    console.warn("[FragmentWeb] Files value is an array, expected object. Attempting to convert...");
    const converted: Record<string, string> = {};
    value.forEach((item, index) => {
      if (typeof item === "object" && item !== null && "path" in item && "content" in item) {
        const path = String(item.path);
        const content = typeof item.content === "string" ? item.content : String(item.content);
        converted[path] = content;
      } else if (typeof item === "string") {
        converted[`file_${index}`] = item;
      }
    });
    return converted;
  }

  const files: Record<string, string> = {};
  const entries = Object.entries(value as Record<string, unknown>);
  
  for (const [path, content] of entries) {
    if (typeof content === "string") {
      files[path] = content;
    } else if (typeof content === "object" && content !== null) {
      if ("content" in content && typeof content.content === "string") {
        files[path] = content.content;
      } else {
        const stringified = JSON.stringify(content);
        if (stringified.length > 0) {
          files[path] = stringified;
        }
      }
    } else if (content !== null && content !== undefined) {
      files[path] = String(content);
    }
  }

  return files;
};

export function FragmentWeb({ data }: FragmentWebProps) {
  const [copied, setCopied] = useState(false);
  const [fragmentKey, setFragmentKey] = useState(0);
  const [isResuming, setIsResuming] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>(data.sandboxUrl);
  const [sandboxId, setSandboxId] = useState<string | null>(data.sandboxId ?? null);
  const [hasAttemptedResume, setHasAttemptedResume] = useState(false);
  const resumePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeAttemptRef = useRef(0);

  const files = useMemo(() => {
    const normalized = normalizeFiles(data.files);
    
    if (Object.keys(normalized).length === 0 && data.files) {
      console.warn("[FragmentWeb] Normalized files is empty but raw files exists:", {
        fragmentId: data._id,
        rawFilesType: typeof data.files,
        rawFilesIsArray: Array.isArray(data.files),
        rawFilesKeys: typeof data.files === "object" && data.files !== null && !Array.isArray(data.files) 
          ? Object.keys(data.files as Record<string, unknown>).length 
          : "N/A",
        rawFilesPreview: JSON.stringify(data.files).substring(0, 200),
      });
    } else if (Object.keys(normalized).length > 0) {
      console.log("[FragmentWeb] Successfully normalized files:", {
        fragmentId: data._id,
        fileCount: Object.keys(normalized).length,
        filePaths: Object.keys(normalized).slice(0, 5),
      });
    }
    
    return normalized;
  }, [data.files, data._id]);
  
  const rawFilesCount = useMemo(() => {
    if (!data.files || typeof data.files !== "object" || data.files === null) {
      return 0;
    }
    if (Array.isArray(data.files)) {
      return data.files.length;
    }
    return Object.keys(data.files as Record<string, unknown>).length;
  }, [data.files]);
  
  const hasFiles = Object.keys(files).length > 0 || rawFilesCount > 0;

  const modelInfo = useMemo(() => {
    const metadata = data.metadata as Record<string, unknown> | undefined;
    if (!metadata) return null;

    const modelName = metadata.modelName as string | undefined;
    const provider = metadata.provider as string | undefined;

    if (!modelName) return null;

    return { modelName, provider };
  }, [data.metadata]);

  const clearResumePoll = useCallback(() => {
    if (resumePollRef.current) {
      clearInterval(resumePollRef.current);
      resumePollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearResumePoll();
    };
  }, [clearResumePoll]);

  useEffect(() => {
    const nextId = data.sandboxId ?? null;
    setSandboxId((prev) => {
      if (prev === nextId) {
        return prev;
      }
      setHasAttemptedResume(false);
      resumeAttemptRef.current = 0;
      return nextId;
    });
    setCurrentUrl(data.sandboxUrl);
  }, [data.sandboxId, data.sandboxUrl]);

  useEffect(() => {
    resumeAttemptRef.current = 0;
  }, [sandboxId]);

  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    // Filter out E2B sandbox system files - only export AI-generated code
    const aiGeneratedFiles = filterAIGeneratedFiles(files);
    const fileEntries = Object.entries(aiGeneratedFiles);

    if (fileEntries.length === 0) {
      return;
    }

    const zip = new JSZip();

    fileEntries.forEach(([filename, content]) => {
      zip.file(filename, content);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-generated-code-${data._id}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resumeSandbox = useCallback(
    async (force = false) => {
      if (!sandboxId || isResuming) {
        return;
      }

      if (!force && hasAttemptedResume) {
        return;
      }

      const MAX_ATTEMPTS = 3;
      if (resumeAttemptRef.current >= MAX_ATTEMPTS) {
        console.error("Sandbox resume attempts exceeded");
        return;
      }

      resumeAttemptRef.current += 1;
      setIsResuming(true);
      setHasAttemptedResume(true);

      try {
        const response = await fetch("/api/transfer-sandbox", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fragmentId: data._id,
          }),
        });

        if (!response.ok) {
          throw new Error("Resume failed");
        }

        let attempts = 0;
        const maxAttempts = 60;

        clearResumePoll();
        resumePollRef.current = setInterval(async () => {
          attempts += 1;

          try {
            const checkResponse = await fetch(`/api/fragment/${data._id}`);
            if (checkResponse.ok) {
              const updatedFragment = await checkResponse.json();

              if (updatedFragment.sandboxUrl) {
                setCurrentUrl(updatedFragment.sandboxUrl);
                setSandboxId(updatedFragment.sandboxId ?? null);
                setFragmentKey((prev) => prev + 1);
                clearResumePoll();
                resumeAttemptRef.current = 0;
                setIsResuming(false);
              }
            }
          } catch (pollError) {
            console.error("Polling error:", pollError);
          }

          if (attempts >= maxAttempts) {
            clearResumePoll();
            setIsResuming(false);
            console.error("Sandbox resume polling timeout");
          }
        }, 1000);
      } catch (error) {
        console.error("Resume error:", error);
        setIsResuming(false);
      }
    },
    [sandboxId, isResuming, hasAttemptedResume, clearResumePoll, data._id],
  );

  useEffect(() => {
    if (!sandboxId || hasAttemptedResume) {
      return;
    }

    if (!data.sandboxUrl) {
      resumeSandbox();
    }
  }, [sandboxId, hasAttemptedResume, data.sandboxUrl, resumeSandbox]);

  const handleIframeError = useCallback(() => {
    setHasAttemptedResume(false);
    resumeSandbox(true);
  }, [resumeSandbox]);

  if (isResuming && !currentUrl) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Resuming Sandbox</h3>
            <p className="text-sm text-muted-foreground mt-1">Restoring your environment. This usually takes a few seconds.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasFiles) {
    console.error("[FragmentWeb] No files detected:", {
      fragmentId: data._id,
      normalizedFileCount: Object.keys(files).length,
      rawFilesCount,
      rawFilesType: typeof data.files,
      rawFilesValue: data.files,
    });
    
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-background p-8">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">No Files Generated</h3>
            <p className="text-sm text-muted-foreground mt-2">
              The code generation didn't produce any files. This might happen if the AI agent encountered an error or if the generation was interrupted.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try sending another message to regenerate the code.
            </p>
            {rawFilesCount > 0 && Object.keys(files).length === 0 && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Note: Files may exist but couldn't be parsed. Check console for details.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col w-full h-full">
      {isResuming && currentUrl && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="text-center">
            <h3 className="text-base font-semibold">Resuming Sandbox</h3>
            <p className="text-xs text-muted-foreground mt-1">Trying to restore the environment while keeping the preview available.</p>
          </div>
        </div>
      )}
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
        <Hint text="Refresh" side="bottom" align="start">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onRefresh();
              if (!currentUrl) {
                resumeSandbox(true);
              }
            }}
          >
            <RefreshCcwIcon />
          </Button>
        </Hint>
        <Hint text="Download Files" side="bottom" align="start">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={!hasFiles}
          >
            <DownloadIcon />
          </Button>
        </Hint>
        {modelInfo && (
          <Hint text={`Generated by ${modelInfo.modelName}`} side="bottom" align="start">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border bg-muted/50",
              "text-xs font-medium text-muted-foreground"
            )}>
              <BotIcon className="size-3.5" />
              <span className="max-w-[120px] truncate">{modelInfo.modelName}</span>
            </div>
          </Hint>
        )}
        <Hint text="Click to copy" side="bottom">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            disabled={!currentUrl || copied}
            className="flex-1 justify-start text-start font-normal"
          >
            <span className="truncate">
              {currentUrl}
            </span>
          </Button>
        </Hint>
        <Hint text="Open in a new tab" side="bottom" align="start">
          <Button
            size="sm"
            disabled={!currentUrl}
            variant="outline"
            onClick={() => {
              if (!currentUrl) return;
              window.open(currentUrl, "_blank");
            }}
          >
            <ExternalLinkIcon />
          </Button>
        </Hint>
      </div>
      <iframe
        key={fragmentKey}
        className="h-full w-full"
        sandbox="allow-forms allow-scripts allow-same-origin"
        loading="lazy"
        src={currentUrl}
        onError={handleIframeError}
      />
    </div>
  );
};
