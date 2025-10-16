import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";

import { getQueryClient, trpc } from "@/trpc/server";
import { ProjectView } from "@/modules/projects/ui/views/project-view";
import { generateProjectMetadata } from "@/lib/seo/metadata";
import { db } from "@/lib/db";

interface Props {
  params: Promise<{
    projectId: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  
  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { name: true, framework: true, updatedAt: true },
    });

    if (!project) {
      return {
        title: "Project Not Found",
        description: "The requested project could not be found.",
        robots: { index: false, follow: false },
      };
    }

    return generateProjectMetadata({
      name: project.name,
      framework: project.framework,
      updatedAt: project.updatedAt,
    });
  } catch {
    return {
      title: "Project",
      description: "View and edit your project on Zapdev",
    };
  }
}

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
