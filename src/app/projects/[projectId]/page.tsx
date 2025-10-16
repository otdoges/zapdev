import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { getQueryClient, trpc } from "@/trpc/server";
import { prisma } from "@/lib/db";
import { generateMetadata as generateSEOMetadata, generateStructuredData } from "@/lib/seo";

import { ProjectView } from "@/modules/projects/ui/views/project-view";

interface Props {
  params: Promise<{
    projectId: string;
  }>
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        Message: {
          where: {
            Fragment: {
              isNot: null
            }
          },
          include: {
            Fragment: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!project) {
      return generateSEOMetadata({
        title: 'Project Not Found',
        description: 'The requested project could not be found.',
        robots: { index: false, follow: false }
      });
    }

    const frameworkName = project.framework.charAt(0) + project.framework.slice(1).toLowerCase();
    
    return generateSEOMetadata({
      title: `${project.name} - ${frameworkName} Project Built with Zapdev`,
      description: `Explore ${project.name}, a ${frameworkName} application built using Zapdev's AI-powered development platform. See how AI can accelerate your development workflow.`,
      keywords: [
        `${frameworkName} project`,
        'AI-built application',
        'Zapdev project',
        project.name,
        `${frameworkName} example`,
        'code generation'
      ],
      canonical: `/projects/${projectId}`,
      openGraph: {
        title: project.name,
        description: `A ${frameworkName} project built with Zapdev AI`,
        type: 'article',
        images: [{
          url: `/api/og/project/${projectId}`,
          width: 1200,
          height: 630,
          alt: project.name
        }]
      },
      robots: {
        index: true,
        follow: true
      }
    });
  } catch (error) {
    return generateSEOMetadata({
      title: 'Project - Zapdev',
      description: 'View project details and code'
    });
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
