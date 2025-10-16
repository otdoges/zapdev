import { Suspense } from "react";
import type { Metadata } from "next";
import { ErrorBoundary } from "react-error-boundary";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient, trpc } from "@/trpc/server";

import { ProjectView } from "@/modules/projects/ui/views/project-view";
import { createPageMetadata } from "@/seo/metadata";

interface Props {
  params: Promise<{
    projectId: string;
  }>
};

const Page = async ({ params }: Props) => {
  const { projectId } = await params;

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.messages.getMany.queryOptions({
    projectId,
  }));
  void queryClient.prefetchQuery(trpc.projects.getOne.queryOptions({
    id: projectId,
  }));

  return ( 
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<p>Error!</p>}>
        <Suspense fallback={<p>Loading Project...</p>}>
          <ProjectView projectId={projectId} />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
};
 
export default Page;

type GenerateMetadataProps = {
  params: Promise<{ projectId: string }>;
};

export async function generateMetadata(
  { params }: GenerateMetadataProps
): Promise<Metadata> {
  const { projectId } = await params;
  return createPageMetadata({
    title: `Project ${projectId}`,
    description: `View details and activity for project ${projectId}.`,
    path: `/projects/${projectId}`,
  });
}
