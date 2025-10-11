import { useState, useEffect } from "react";
import { ExternalLinkIcon, RefreshCcwIcon, DownloadIcon } from "lucide-react";

import { Hint } from "@/components/hint";
import { Fragment } from "@/generated/prisma";
import { Button } from "@/components/ui/button";

interface Props {
  data: Fragment;
};

export function FragmentWeb({ data }: Props) {
  const [copied, setCopied] = useState(false);
  const [fragmentKey, setFragmentKey] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(data.sandboxUrl);

  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if sandbox is older than 55 minutes and auto-transfer
  useEffect(() => {
    const checkAndTransferSandbox = async () => {
      if (!data.createdAt) return;

      const sandboxAge = Date.now() - new Date(data.createdAt).getTime();
      const FIFTY_FIVE_MINUTES = 55 * 60 * 1000;

      if (sandboxAge >= FIFTY_FIVE_MINUTES) {
        setIsTransferring(true);

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
            throw new Error("Transfer failed");
          }

          // Poll for the updated fragment
          let attempts = 0;
          const maxAttempts = 60;

          const pollInterval = setInterval(async () => {
            attempts++;

            try {
              const checkResponse = await fetch(`/api/fragment/${data.id}`);
              if (checkResponse.ok) {
                const updatedFragment = await checkResponse.json();

                if (updatedFragment.sandboxUrl !== currentUrl) {
                  setCurrentUrl(updatedFragment.sandboxUrl);
                  setFragmentKey((prev) => prev + 1);
                  clearInterval(pollInterval);
                  setIsTransferring(false);
                }
              }
            } catch (err) {
              console.error("Polling error:", err);
            }

            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setIsTransferring(false);
            }
          }, 2000);
        } catch (error) {
          console.error("Transfer error:", error);
          setIsTransferring(false);
        }
      }
    };

    checkAndTransferSandbox();
  }, [data.id, data.createdAt, currentUrl]);

  if (isTransferring) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Transferring to Fresh Sandbox</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your app is being moved to a new sandbox. This will take a moment...
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
        <Hint text="Download files" side="bottom" align="start">
          <Button
            size="sm"
            disabled={!data.id}
            variant="outline"
            onClick={async () => {
              if (!data.id) return;
              try {
                const response = await fetch(`/api/fragment/${data.id}/download`);

                if (!response.ok) {
                  throw new Error("Unable to download fragment");
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${data.title || "fragment"}.zip`;
                link.click();
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error("Download failed", error);
              }
            }}
          >
            <DownloadIcon />
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
