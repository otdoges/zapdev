import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient, trpc } from "@/trpc/server";

import { ProjectView } from "@/modules/projects/ui/views/project-view";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/db";

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

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, id: true },
  });

  const title = project ? `${project.name}` : "Project";
  const description = project
    ? `Explore project ${project.name} on Zapdev. View code, fragments, and demos.`
    : "Explore a project on Zapdev.";

  return buildPageMetadata({
    title,
    description,
    canonicalPath: `/projects/${projectId}`,
    imagePath: `/api/og/projects/${projectId}`,
  });
}
