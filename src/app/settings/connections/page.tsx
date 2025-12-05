"use client";

import { useQuery } from "convex/react";
import { useUser } from "@/lib/auth-client";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ConnectionsPage() {
  const user = useUser();
  const connectionsData = useQuery(api.oauth.listConnections, user ? {} : "skip");

  // Convert array to object with provider as key
  const connections = connectionsData?.reduce((acc, conn) => {
    acc[conn.provider.toLowerCase()] = conn;
    return acc;
  }, {} as Record<string, typeof connectionsData[0]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connections</h1>
        <p className="text-muted-foreground">
          Manage your connected accounts and integrations
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Figma</CardTitle>
                <CardDescription>
                  Import designs directly from Figma
                </CardDescription>
              </div>
              {connections?.figma ? (
                <Badge variant="default">Connected</Badge>
              ) : (
                <Button variant="outline">Connect</Button>
              )}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>GitHub</CardTitle>
                <CardDescription>
                  Import code from GitHub repositories
                </CardDescription>
              </div>
              {connections?.github ? (
                <Badge variant="default">Connected</Badge>
              ) : (
                <Button variant="outline">Connect</Button>
              )}
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
