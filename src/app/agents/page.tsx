"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AgentsPage() {
  const jobs = useQuery(api.backgroundJobs.list);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Background Agents</h1>
        <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs?.map((job) => (
          <Link href={`/agents/${job._id}`} key={job._id}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{job.title}</CardTitle>
                  <Badge variant={job.status === "running" ? "default" : "secondary"}>
                    {job.status}
                  </Badge>
                </div>
                <CardDescription>Created {new Date(job.createdAt).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {job.councilDecisions?.[0] || "No activity yet."}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {jobs?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
                No active agents. Start a new 10x SWE task.
            </div>
        )}
      </div>
    </div>
  );
}
