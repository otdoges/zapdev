import Image from "next/image";
import { format } from "date-fns";
import { ChevronRightIcon, Code2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type MessageRole = "USER" | "ASSISTANT";
type MessageType = "RESULT" | "STREAM";

interface UserMessageProps {
  content: string;
  attachments?: any[];
}

const UserMessage = ({ content, attachments }: UserMessageProps) => {
  return (
    <div className="flex justify-end pb-4 pr-2 pl-10">
      <div className="flex flex-col gap-2 max-w-[80%]">
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="relative">
                <Image
                  src={attachment.url}
                  alt="Attachment"
                  width={attachment.width || 200}
                  height={attachment.height || 200}
                  className="rounded-lg object-cover border max-h-48 w-auto"
                />
              </div>
            ))}
          </div>
        )}
        <Card className="rounded-lg bg-muted p-3 shadow-none border-none break-words">
          {content}
        </Card>
      </div>
    </div>
  );
}

interface anyCardProps {
  fragment: any;
  isActiveany: boolean;
  onanyClick: (fragment: any) => void;
};

const anyCard = ({
  fragment,
  isActiveany,
  onanyClick,
}: anyCardProps) => {
  return (
    <button
      className={cn(
        "flex items-start text-start gap-2 border rounded-lg bg-muted w-fit p-3 hover:bg-secondary transition-colors",
        isActiveany && 
          "bg-primary text-primary-foreground border-primary hover:bg-primary",
      )}
      onClick={() => onanyClick(fragment)}
    >
      <Code2Icon className="size-4 mt-0.5" />
      <div className="flex flex-col flex-1">
        <span className="text-sm font-medium line-clamp-1">
          {fragment.title}
        </span>
        <span className="text-sm">Preview</span>
      </div>
      <div className="flex items-center justify-center mt-0.5">
        <ChevronRightIcon className="size-4" />
      </div>
    </button>
  );
};

interface AssistantMessageProps {
  content: string;
  fragment: any | null;
  createdAt: Date;
  isActiveany: boolean;
  onanyClick: (fragment: any) => void;
  type: MessageType;
};

const AssistantMessage = ({
  content,
  fragment,
  createdAt,
  isActiveany,
  onanyClick,
  type,
}: AssistantMessageProps) => {
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
      <div className="pl-8.5 flex flex-col gap-y-4">
        <span>{content}</span>
        {fragment && type === "RESULT" && (
          <anyCard
            fragment={fragment}
            isActiveany={isActiveany}
            onanyClick={onanyClick}
          />
        )}
      </div>
    </div>
  )
};

interface MessageCardProps {
  content: string;
  role: MessageRole;
  fragment: any | null;
  createdAt: Date;
  isActiveany: boolean;
  onanyClick: (fragment: any) => void;
  type: MessageType;
  attachments?: Attachment[];
};

export const MessageCard = ({
  content,
  role,
  fragment,
  createdAt,
  isActiveany,
  onanyClick,
  type,
  attachments,
}: MessageCardProps) => {
  if (role === "ASSISTANT") {
    return (
      <AssistantMessage
        content={content}
        fragment={fragment}
        createdAt={createdAt}
        isActiveany={isActiveany}
        onanyClick={onanyClick}
        type={type}
      />
    )
  }

  return (
    <UserMessage content={content} attachments={attachments} />
  );
};
