"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type BackgroundJob = Doc<"backgroundJobs">;

export default function AgentsPage() {
  const jobs = useQuery(api.backgroundJobs.list);

  const header = (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Background Agents</h1>
      <Button>
        <PlusIcon className="mr-2 h-4 w-4" />
        New Agent
      </Button>
    </div>
  );

  if (!jobs) {
    return (
      <div className="container mx-auto py-8">
        {header}
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {header}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job: BackgroundJob) => (
          <JobCard key={job._id} job={job} />
        ))}
        {jobs.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No active agents. Start a new 10x SWE task.
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job }: { job: BackgroundJob }) {
  const decisions = useQuery(api.councilDecisions.listByJob, { jobId: job._id });
  const latestDecision = decisions?.[0];
  const summary = latestDecision?.reasoning ?? latestDecision?.verdict;
  const description = summary ?? "No activity yet.";
  const createdAtLabel = job.createdAt
    ? new Date(job.createdAt).toLocaleDateString()
    : "Unknown date";

  return (
    <Link href={`/agents/${job._id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{job.title}</CardTitle>
            <Badge variant={job.status === "running" ? "default" : "secondary"}>
              {job.status}
            </Badge>
          </div>
          <CardDescription>Created {createdAtLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
