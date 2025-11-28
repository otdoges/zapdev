"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AgentDetailPage() {
  const params = useParams();
  const jobId = params.jobId as Id<"backgroundJobs">;
  const job = useQuery(api.backgroundJobs.get, { jobId });

  if (!job) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <p className="text-muted-foreground">Job ID: {job._id}</p>
        </div>
        <Badge className="text-lg px-4 py-1">{job.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader><CardTitle>Console Logs</CardTitle></CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-black text-green-400 font-mono text-sm">
                        {job.logs?.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                        {!job.logs?.length && <div className="text-gray-500">// No logs yet</div>}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader><CardTitle>Council Decisions</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {job.councilDecisions?.map((decision, i) => (
                            <div key={i} className="p-3 bg-muted rounded-lg text-sm">
                                {decision}
                            </div>
                        ))}
                        {!job.councilDecisions?.length && <div className="text-muted-foreground">No council decisions yet.</div>}
                    </div>
                </CardContent>
            </Card>
            
            {job.sandboxId && (
                <Card>
                    <CardHeader><CardTitle>Environment</CardTitle></CardHeader>
                    <CardContent>
                        <p>Sandbox ID: {job.sandboxId}</p>
                        {/* Link to cua session would go here */}
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}
