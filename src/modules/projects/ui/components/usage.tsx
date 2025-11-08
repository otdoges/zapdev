import Link from "next/link";
import { useMemo } from "react";
import { useCustomer } from "autumn-js/react";
import { CrownIcon } from "lucide-react";
import { formatDuration, intervalToDuration } from "date-fns";

import { Button } from "@/components/ui/button";

interface Props {
  points: number;
  msBeforeNext: number;
};

export const Usage = ({ points, msBeforeNext }: Props) => {
  const { customer } = useCustomer();
  const hasProAccess = customer?.products?.some(p => p.id === "pro" || p.id === "pro_annual") ?? false;

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
