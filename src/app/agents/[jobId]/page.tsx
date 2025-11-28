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
  const decisions = useQuery(api.councilDecisions.listByJob, { jobId });

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
                        {decisions ? (
                            decisions.length ? (
                                decisions.map((decision) => (
                                    <div key={decision._id.toString()} className="space-y-3 rounded-lg border border-border bg-muted/50 p-3 text-sm">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="font-semibold">{decision.step}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {decision.verdict}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground text-xs leading-relaxed">{decision.reasoning}</p>
                                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                            <span>Agents: {decision.agents.join(", ")}</span>
                                            <span>
                                                {decision.createdAt
                                                    ? new Date(decision.createdAt).toLocaleString()
                                                    : "Unknown time"}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-muted-foreground">No council decisions yet.</div>
                            )
                        ) : (
                            <div className="text-muted-foreground">Loading decisions…</div>
                        )}
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
