"use client";

import { z } from "zod";
import { toast } from "sonner";
import Image from "next/image";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon, ImageIcon, XIcon, DownloadIcon, FigmaIcon, GitBranchIcon } from "lucide-react";
import { UploadButton } from "@uploadthing/react";
import { useAction } from "convex/react";
import { api } from "@/lib/convex-api";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { PROJECT_TEMPLATES } from "../../constants";
import type { OurFileRouter } from "@/lib/uploadthing";

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

export const ProjectForm = () => {
  const router = useRouter();
  const clerk = useClerk();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
    },
  });

  const createProjectWithMessageAndAttachments = useAction(api.projects.createWithMessageAndAttachments);
  const [isCreating, setIsCreating] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsCreating(true);
      const result = await createProjectWithMessageAndAttachments({
        value: values.value,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // Trigger Inngest event for AI processing
      await fetch("/api/inngest/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: result.id,
          value: result.value,
        }),
      });

      form.reset();
      setAttachments([]);
      router.push(`/projects/${result.id}`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);

        if (error.message.includes("Unauthenticated") || error.message.includes("Not authenticated")) {
          clerk.openSignIn();
        }

        if (error.message.includes("credits") || error.message.includes("out of credits")) {
          router.push("/pricing");
        }
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFigmaImport = async () => {
    setIsImportMenuOpen(false);
    try {
      // Navigate to Figma OAuth flow
      window.location.href = "/api/import/figma/auth";
    } catch {
      toast.error("Failed to start Figma import");
    }
  };

  const handleGitHubImport = async () => {
    setIsImportMenuOpen(false);
    try {
      // Navigate to GitHub OAuth flow
      window.location.href = "/api/import/github/auth";
    } catch {
      toast.error("Failed to start GitHub import");
    }
  };

  const onSelect = (value: string) => {
    form.setValue("value", value, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  const [isFocused, setIsFocused] = useState(false);
  const isPending = isCreating;
  const isButtonDisabled = isPending || !form.formState.isValid || isUploading;

  return (
    <Form {...form}>
      <section className="space-y-6">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
            isFocused && "shadow-xs",
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
              <Popover open={isImportMenuOpen} onOpenChange={setIsImportMenuOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    type="button"
                    disabled={isPending || isUploading}
                  >
                    <DownloadIcon className="size-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleFigmaImport}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-accent text-left text-sm"
                    >
                      <FigmaIcon className="size-4" />
                      <span>Import from Figma</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGitHubImport}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-accent text-left text-sm"
                    >
                      <GitBranchIcon className="size-4" />
                      <span>Import from GitHub</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
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
        <div className="flex-wrap justify-center gap-2 hidden md:flex max-w-3xl">
          {PROJECT_TEMPLATES.map((template) => (
            <Button 
              key={template.title}
              variant="outline"
              size="sm"
              className="bg-white dark:bg-sidebar"
              onClick={() => onSelect(template.prompt)}
            >
              {template.emoji} {template.title}
            </Button>
          ))}
        </div>
      </section>
    </Form>
  );
};
