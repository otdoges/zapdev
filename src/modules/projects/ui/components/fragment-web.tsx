import { useState, useEffect, useRef, useCallback } from "react";
import { ExternalLinkIcon, RefreshCcwIcon, WrenchIcon } from "lucide-react";

import { Hint } from "@/components/hint";
import { Fragment } from "@/generated/prisma";
import { Button } from "@/components/ui/button";

interface Props {
  data: Fragment;
};

export function FragmentWeb({ data }: Props) {
  const [copied, setCopied] = useState(false);
  const [fragmentKey, setFragmentKey] = useState(0);
  const [isResuming, setIsResuming] = useState(false);
  const [isFixingErrors, setIsFixingErrors] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(data.sandboxUrl);
  const [sandboxId, setSandboxId] = useState<string | null>(data.sandboxId ?? null);
  const [hasAttemptedResume, setHasAttemptedResume] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearFixErrorTimers = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const clearResumePoll = useCallback(() => {
    if (resumePollRef.current) {
      clearInterval(resumePollRef.current);
      resumePollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearFixErrorTimers();
      clearResumePoll();
    };
  }, [clearFixErrorTimers, clearResumePoll]);

  useEffect(() => {
    const nextId = data.sandboxId ?? null;
    setSandboxId((prev) => {
      if (prev === nextId) {
        return prev;
      }
      setHasAttemptedResume(false);
      return nextId;
    });
    setCurrentUrl(data.sandboxUrl);
  }, [data.sandboxId, data.sandboxUrl]);

  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFixErrors = async () => {
    setIsFixingErrors(true);
    try {
      const response = await fetch("/api/fix-errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fragmentId: data.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Error fix failed");
      }

      clearFixErrorTimers();

      const pollIntervalMs = 2000;
      const maxAttempts = 60;
      const pollTimeoutMs = maxAttempts * pollIntervalMs;
      let attempts = 0;
      let isComplete = false;

      const finish = () => {
        if (isComplete) return;
        isComplete = true;
        clearFixErrorTimers();
        setIsFixingErrors(false);
      };

      pollIntervalRef.current = setInterval(() => {
        attempts += 1;
        setFragmentKey((prev) => prev + 1);

        if (attempts >= maxAttempts) {
          finish();
        }
      }, pollIntervalMs);

      pollTimeoutRef.current = setTimeout(finish, pollTimeoutMs);
    } catch (error) {
      console.error("Error fix failed:", error);
      clearFixErrorTimers();
      setIsFixingErrors(false);
    }
  };

  useEffect(() => {
    if (!sandboxId || hasAttemptedResume) {
      return;
    }

    let cancelled = false;

    const resumeSandbox = async () => {
      setIsResuming(true);
      setHasAttemptedResume(true);

      try {
        const response = await fetch("/api/transfer-sandbox", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fragmentId: data.id,
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

          if (cancelled) {
            clearResumePoll();
            return;
          }

          try {
            const checkResponse = await fetch(`/api/fragment/${data.id}`);
            if (checkResponse.ok) {
              const updatedFragment = await checkResponse.json();

              if (updatedFragment.sandboxUrl) {
                setCurrentUrl(updatedFragment.sandboxUrl);
                setSandboxId(updatedFragment.sandboxId ?? null);
                setFragmentKey((prev) => prev + 1);
                clearResumePoll();
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
        if (!cancelled) {
          setIsResuming(false);
        }
      }
    };

    resumeSandbox();

    return () => {
      cancelled = true;
      clearResumePoll();
    };
  }, [sandboxId, hasAttemptedResume, data.id, clearResumePoll]);

  if (isResuming) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Resuming Sandbox</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Restoring your environment. This usually takes a few seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isFixingErrors) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Fixing Errors</h3>
            <p className="text-sm text-muted-foreground mt-1">
              AI is analyzing and fixing the errors in your code...
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              ✨ No credits will be charged for error fixes
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
        <Hint text="Refresh" side="bottom" align="start">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCcwIcon />
          </Button>
        </Hint>
        <Hint text="Fix Errors (Free)" side="bottom" align="start">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleFixErrors}
            disabled={isFixingErrors}
          >
            <WrenchIcon />
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
      />
    </div>
  )
};
