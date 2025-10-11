import Image from "next/image";
import { useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { format } from "date-fns";
import { FilePenLineIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fragment, MessageRole, MessageType } from "@/generated/prisma";

interface UserMessageProps {
  content: string;
}

const UserMessage = ({ content }: UserMessageProps) => {
  return (
    <div className="flex justify-end pb-4 pr-2 pl-10">
      <Card className="rounded-lg bg-muted p-3 shadow-none border-none max-w-[80%] break-words">
        {content}
      </Card>
    </div>
  );
}

interface FragmentCardProps {
  fragment: Fragment;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
};

const FragmentCard = ({
  fragment,
  isActiveFragment,
  onFragmentClick,
}: FragmentCardProps) => {
  const filePaths = useMemo(() => {
    const files = fragment.files as unknown;

    if (!files || typeof files !== "object" || Array.isArray(files)) {
      return [];
    }

    return Object.keys(files as Record<string, unknown>);
  }, [fragment.files]);

  const primaryFile = filePaths[0] ?? fragment.title;
  const remainingFiles = filePaths.slice(1);
  const [showAllFiles, setShowAllFiles] = useState(false);

  const formatPath = (path: string) => {
    const segments = path.split("/");
    return segments[segments.length - 1] || path;
  };

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setShowAllFiles((prev) => !prev);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onFragmentClick(fragment);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-muted/70 p-3 text-sm text-muted-foreground transition-colors cursor-pointer hover:bg-muted",
        isActiveFragment && 
          "border-primary bg-primary/10 text-foreground hover:bg-primary/10",
      )}
      onClick={() => onFragmentClick(fragment)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-2">
        <FilePenLineIcon className="size-4 shrink-0" />
        <Badge
          variant="secondary"
          className="shrink-0 text-[10px] uppercase tracking-wide"
        >
          Editing
        </Badge>
        <span className="truncate font-medium text-foreground">
          {formatPath(primaryFile)}
        </span>
        {remainingFiles.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2 text-xs"
            onClick={handleToggle}
          >
            {showAllFiles ? "Hide" : "Show all"}
          </Button>
        )}
      </div>
      {showAllFiles && remainingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-6">
          {remainingFiles.map((path) => (
            <span
              key={path}
              className="rounded-md bg-background/70 px-2 py-1 text-xs font-medium text-muted-foreground"
            >
              {formatPath(path)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface AssistantMessageProps {
  content: string;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
};

const AssistantMessage = ({
  content,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  type,
}: AssistantMessageProps) => {
  const formattedContent = useMemo(() => content.trim(), [content]);

  return (
    <div className={cn(
      "flex flex-col group px-2 pb-4",
      type === "ERROR" && "text-red-700 dark:text-red-500",
    )}>
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image
          src="/logo.svg"
          alt="ZapDev"
          width={18}
          height={18}
          className="shrink-0"
        />
        <span className="text-sm font-medium">ZapDev</span>
        <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {format(createdAt, "HH:mm 'on' MMM dd, yyyy")}
        </span>
      </div>
      <div className="pl-8 flex flex-col gap-y-4">
        <div className="w-fit max-w-full rounded-lg border border-border/80 bg-card px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap shadow-sm">
          {formattedContent}
        </div>
        {fragment && type === "RESULT" && (
          <FragmentCard
            fragment={fragment}
            isActiveFragment={isActiveFragment}
            onFragmentClick={onFragmentClick}
          />
        )}
      </div>
    </div>
  )
};

interface MessageCardProps {
  content: string;
  role: MessageRole;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
};

export const MessageCard = ({
  content,
  role,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  type,
}: MessageCardProps) => {
  if (role === "ASSISTANT") {
    return (
      <AssistantMessage
        content={content}
        fragment={fragment}
        createdAt={createdAt}
        isActiveFragment={isActiveFragment}
        onFragmentClick={onFragmentClick}
        type={type}
      />
    )
  }

  return (
    <UserMessage content={content} />
  );
};
