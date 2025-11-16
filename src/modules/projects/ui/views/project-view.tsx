"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense, useMemo, useState } from "react";
import { EyeIcon, CodeIcon, CrownIcon } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { Button } from "@/components/ui/button";
import { UserControl } from "@/components/user-control";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { ProjectHeader } from "../components/project-header";
import { MessagesContainer } from "../components/messages-container";
import { ErrorBoundary } from "react-error-boundary";
import type { Doc } from "@/convex/_generated/dataModel";
import { filterAIGeneratedFiles } from "@/lib/filter-ai-files";

// Dynamically import heavy components
const FileExplorer = dynamic(() => import("@/components/file-explorer").then(m => m.FileExplorer), {
  loading: () => <p className="p-4">Loading file explorer...</p>,
  ssr: false,
});

const FragmentWeb = dynamic(() => import("../components/fragment-web").then(m => m.FragmentWeb), {
  loading: () => <p className="p-4">Loading preview...</p>,
  ssr: false,
});

interface Props {
  projectId: string;
};

export const ProjectView = ({ projectId }: Props) => {
  const usage = useQuery(api.usage.getUsage);
  const hasProAccess = usage?.planType === "pro";

  const [activeFragment, setActiveFragment] = useState<Doc<"fragments"> | null>(null);
  const [tabState, setTabState] = useState<"preview" | "code">("preview");

  const explorerFiles = useMemo(() => {
    if (!activeFragment) {
      console.debug('[ProjectView] No active fragment');
      return {} as Record<string, string>;
    }

    console.log('[ProjectView] Active fragment:', {
      id: activeFragment._id,
      filesType: typeof activeFragment.files,
      filesIsNull: activeFragment.files === null,
      filesKeys: activeFragment.files ? Object.keys(activeFragment.files as Record<string, unknown>).length : 0,
    });

    if (typeof activeFragment.files !== "object" || activeFragment.files === null) {
      console.warn('[ProjectView] Fragment files is not a valid object:', activeFragment.files);
      return {} as Record<string, string>;
    }

    // Normalize files: convert any non-string values to empty objects
    const normalizedFiles = Object.entries(activeFragment.files as Record<string, unknown>).reduce<Record<string, string>>(
      (acc, [path, content]) => {
        if (typeof content === "string") {
          acc[path] = content;
        } else {
          console.warn(`[ProjectView] Skipping non-string file content for: ${path}`, typeof content);
        }
        return acc;
      },
      {}
    );

    console.log(`[ProjectView] Normalized ${Object.keys(normalizedFiles).length} files`);
    
    if (Object.keys(normalizedFiles).length === 0) {
      console.error('[ProjectView] No valid files found after normalization!');
      console.error('[ProjectView] Raw files object:', activeFragment.files);
      // Return empty object to show "No files" message
      return {} as Record<string, string>;
    }

    // Filter out E2B sandbox system files - only show AI-generated code
    const filtered = filterAIGeneratedFiles(normalizedFiles);
    
    console.log(`[ProjectView] After filtering: ${Object.keys(filtered).length} files`);
    
    if (Object.keys(filtered).length === 0 && Object.keys(normalizedFiles).length > 0) {
      console.error('[ProjectView] All files were filtered out! Returning unfiltered files as fallback.');
      // Fallback: if filtering removed all files, show the normalized files anyway
      return normalizedFiles;
    }

    return filtered;
  }, [activeFragment]);

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <ErrorBoundary fallback={<p>Project header error</p>}>
            <Suspense fallback={<p>Loading project...</p>}>
              <ProjectHeader projectId={projectId} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary fallback={<p>Messages container error</p>}>
            <Suspense fallback={<p>Loading messages...</p>}>
              <MessagesContainer
                projectId={projectId}
                activeFragment={activeFragment}
                setActiveFragment={setActiveFragment}
              />
            </Suspense>
          </ErrorBoundary>
        </ResizablePanel>
        <ResizableHandle className="hover:bg-primary transition-colors" />
        <ResizablePanel
          defaultSize={65}
          minSize={50}
        >
          <Tabs
            className="h-full gap-y-0"
            defaultValue="preview"
            value={tabState}
            onValueChange={(value) => setTabState(value as "preview" | "code")}
          >
            <div className="w-full flex items-center p-2 border-b gap-x-2">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon /> <span>Demo</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon /> <span>Code</span>
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-x-2">
                {!hasProAccess && (
                  <Button asChild size="sm" variant="tertiary">
                    <Link href="/pricing">
                      <CrownIcon /> Upgrade
                    </Link>
                  </Button>
                )}
                <UserControl />
              </div>
            </div>
            <TabsContent value="preview">
              {!!activeFragment && <FragmentWeb data={activeFragment} />}
            </TabsContent>
            <TabsContent value="code" className="min-h-0">
              {activeFragment && (
                <FileExplorer 
                  files={explorerFiles} 
                  fragmentId={activeFragment._id}
                  allFiles={activeFragment.files as Record<string, unknown>}
                />
              )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
