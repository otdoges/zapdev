import { z } from "zod";
import { toast } from "sonner";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon, ImageIcon, XIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UploadButton } from "@uploadthing/react";

import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";

import { Usage } from "./usage";
import type { OurFileRouter } from "@/lib/uploadthing";

interface Props {
  projectId: string;
};

const formSchema = z.object({
  value: z.string()
    .min(1, { message: "Value is required" })
    .max(10000, { message: "Value is too long" }),
})

interface AttachmentData {
  url: string;
  size: number;
  width?: number;
  height?: number;
}

export const MessageForm = ({ projectId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: usage } = useQuery(trpc.usage.status.queryOptions());

  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
    },
  });

  const createMessage = useMutation(trpc.messages.create.mutationOptions({
    onSuccess: () => {
      form.reset();
      setAttachments([]);
      queryClient.invalidateQueries(
        trpc.messages.getMany.queryOptions({ projectId }),
      );
      queryClient.invalidateQueries(
        trpc.usage.status.queryOptions()
      );
    },
    onError: (error) => {
      toast.error(error.message);

      if (error.data?.code === "TOO_MANY_REQUESTS") {
        router.push("/pricing");
      }
    },
  }));

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createMessage.mutateAsync({
      value: values.value,
      projectId,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const [isFocused, setIsFocused] = useState(false);
  const isPending = createMessage.isPending;
  const isButtonDisabled = isPending || !form.formState.isValid || isUploading;
  const showUsage = !!usage;

  return (
    <Form {...form}>
      {showUsage && (
        <Usage
          points={usage.remainingPoints}
          msBeforeNext={usage.msBeforeNext}
        />
      )}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && "shadow-xs",
          showUsage && "rounded-t-none",
        )}
      >
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <TextareaAutosize
              {...field}
              disabled={isPending}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              minRows={2}
              maxRows={8}
              className="pt-4 resize-none border-none w-full outline-none bg-transparent"
              placeholder="What would you like to build?"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  form.handleSubmit(onSubmit)(e);
                }
              }}
            />
          )}
        />
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative group">
                <Image
                  src={attachment.url}
                  alt="Attachment"
                  width={80}
                  height={80}
                  className="rounded-lg object-cover border"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-x-2 items-end justify-between pt-2">
          <div className="flex items-center gap-2">
            <UploadButton<OurFileRouter, "imageUploader">
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                if (res) {
                  const newAttachments = res.map((file) => ({
                    url: file.url,
                    size: file.size,
                  }));
                  setAttachments((prev) => [...prev, ...newAttachments]);
                  toast.success("Images uploaded successfully");
                }
                setIsUploading(false);
              }}
              onUploadError={(error: Error) => {
                toast.error(`Upload failed: ${error.message}`);
                setIsUploading(false);
              }}
              onUploadBegin={() => {
                setIsUploading(true);
              }}
              appearance={{
                button: "size-8 bg-transparent border-none p-0 hover:bg-transparent focus-within:ring-0 focus-within:ring-offset-0",
                allowedContent: "hidden",
              }}
              content={{
                button: isUploading ? (
                  <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <ImageIcon className="size-4 text-muted-foreground" />
                ),
              }}
            />
            <div className="text-[10px] text-muted-foreground font-mono">
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span>&#8984;</span>Enter
              </kbd>
              &nbsp;to submit
            </div>
          </div>
          <Button
            disabled={isButtonDisabled}
            className={cn(
              "size-8 rounded-full",
              isButtonDisabled && "bg-muted-foreground border"
            )}
          >
            {isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <ArrowUpIcon />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
