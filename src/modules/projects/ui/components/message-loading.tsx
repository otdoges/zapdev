import Image from "next/image";
import { useState, useEffect } from "react";
import { LightbulbIcon } from "lucide-react";

const formatDuration = (seconds: number) => {
  if (seconds < 1) {
    return "Thinking...";
  }

  if (seconds < 60) {
    return `Thought for ${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `Thought for ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }

  return `Thought for ${minutes}m ${remainingSeconds}s`;
};

const ThinkingIndicator = () => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setElapsedSeconds(0);

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
      <LightbulbIcon className="size-4 text-muted-foreground" />
      <span className="font-medium">{formatDuration(elapsedSeconds)}</span>
    </div>
  );
};

export const MessageLoading = () => {
  return (
    <div className="flex flex-col group px-2 pb-4">
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image
          src="/logo.svg"
          alt="ZapDev"
          width={18}
          height={18}
          className="shrink-0"
        />
        <span className="text-sm font-medium">ZapDev</span>
      </div>
      <div className="pl-8 flex flex-col gap-y-4">
        <ThinkingIndicator />
      </div>
    </div>
  );
};
