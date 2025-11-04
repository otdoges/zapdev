import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ExternalLinkIcon, RefreshCcwIcon, DownloadIcon } from "lucide-react";
import JSZip from "jszip";

import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";

interface FragmentWebProps {
  data: Doc<"fragments">;
}

const normalizeFiles = (value: Doc<"fragments">["files"]): Record<string, string> => {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
    (acc, [path, content]) => {
      if (typeof content === "string") {
        acc[path] = content;
      }
      return acc;
    },
    {}
  );
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

  const files = useMemo(() => normalizeFiles(data.files), [data.files]);

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
    const fileEntries = Object.entries(files);

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
    link.download = `fragment-${data._id}.zip`;
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
            disabled={Object.keys(files).length === 0}
          >
            <DownloadIcon />
          </Button>
        </Hint>
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
