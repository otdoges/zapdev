"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

import { PROJECT_TEMPLATES } from "../../constants";

const formSchema = z.object({
  value: z.string()
    .min(1, { message: "Value is required" })
    .max(10000, { message: "Value is too long" }),
});

const JsonLdScript = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Action",
    name: "Generate project with Zapdev",
    target: "https://zapdev.link/",
    agent: {
      "@type": "Organization",
      name: "Zapdev",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

type ProjectTemplate = (typeof PROJECT_TEMPLATES)[number];

export const ProjectForm = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const clerk = useClerk();
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
    },
  });
  
  const createProject = useMutation(trpc.projects.create.mutationOptions({
    onSuccess: (data) => {
      queryClient.invalidateQueries(
        trpc.projects.getMany.queryOptions(),
      );
      queryClient.invalidateQueries(
        trpc.usage.status.queryOptions(),
      );
      router.push(`/projects/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
      
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }

      if (error.data?.code === "TOO_MANY_REQUESTS") {
        router.push("/pricing");
      }
    },
  }));
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createProject.mutateAsync({
      value: values.value,
    });
  };

  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const onSelect = (value: string) => {
    form.setValue("value", value, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
  };
  
  const [isFocused, setIsFocused] = useState(false);
  const isPending = createProject.isPending;
  const isButtonDisabled = isPending || !form.formState.isValid;

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    onSelect(template.prompt);
  };

  return (
    <Form {...form}>
      <section className="space-y-6">
        <JsonLdScript />
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            "relative space-y-4 rounded-xl border bg-sidebar p-4 transition-all dark:bg-sidebar",
            isFocused && "shadow-xs",
          )}
        >
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <TextareaAutosize
                    {...field}
                    disabled={isPending}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    minRows={2}
                    maxRows={8}
                    className="w-full resize-none border-none bg-transparent pt-4 outline-none"
                    placeholder="What would you like to build?"
                    onChange={(event) => {
                      field.onChange(event);
                      if (
                        selectedTemplate &&
                        event.target.value !== selectedTemplate.prompt
                      ) {
                        setSelectedTemplate(null);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                        event.preventDefault();
                        form.handleSubmit(onSubmit)(event);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-end justify-between gap-2">
            <div className="text-[10px] font-mono text-muted-foreground">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span>&#8984;</span>Enter
              </kbd>
              &nbsp;to submit
            </div>
            <Button
              type="submit"
              disabled={isButtonDisabled}
              className={cn(
                "size-8 rounded-full",
                isButtonDisabled && "border bg-muted-foreground"
              )}
            >
              {isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <ArrowUpIcon />
              )}
            </Button>
          </div>
          {selectedTemplate && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Selected template:</span>
              <Badge variant="secondary">{selectedTemplate.title}</Badge>
            </div>
          )}
        </form>
        <div className="grid gap-2 md:grid-cols-2">
          {PROJECT_TEMPLATES.map((template) => {
            const isActive = selectedTemplate?.title === template.title;

            return (
              <button
                key={template.title}
                type="button"
                disabled={isPending}
                onClick={() => handleTemplateSelect(template)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive && "border-primary bg-primary/5"
                )}
              >
                <span className="text-xl">{template.emoji}</span>
                <span className="space-y-1">
                  <span className="block font-medium">{template.title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {template.prompt}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </Form>
  );
};
