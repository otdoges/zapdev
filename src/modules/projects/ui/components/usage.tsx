import Link from "next/link";
import { useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CrownIcon } from "lucide-react";
import { formatDuration, intervalToDuration } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";

interface Props {
  points: number;
  msBeforeNext: number;
};

export const Usage = ({ points, msBeforeNext }: Props) => {
  const { data: session } = useSession();
  const subscriptionStatus = useQuery(
    api.users.getSubscriptionStatus,
    session?.user?.id ? { userId: session.user.id as Id<"users"> } : "skip"
  );
  const hasProAccess = subscriptionStatus?.plan === "pro";

  const resetTime = useMemo(() => {
    try {
      return formatDuration(
        intervalToDuration({
          start: new Date(),
          end: new Date(Date.now() + msBeforeNext),
        }),
        { format: ["months", "days", "hours"] }
      )
    } catch (error) {
      console.error("Error formatting duration ", error);
      return "unknown";
    }
  }, [msBeforeNext]);

  return (
    <div className="rounded-t-xl bg-background border border-b-0 p-2.5">
      <div className="flex items-center gap-x-2">
        <div>
          <p className="text-sm">
            {points} {hasProAccess ? "": "free"} credits remaining
          </p>
          <p className="text-xs text-muted-foreground">
            Resets in{" "}{resetTime}
          </p>
        </div>
        {!hasProAccess && (
          <Button
            asChild
            size="sm"
            variant="tertiary"
            className="ml-auto"
          >
            <Link href="/pricing">
              <CrownIcon /> Upgrade
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};
