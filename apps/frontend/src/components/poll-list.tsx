"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { usePollCount } from "@/hooks/use-polls";
import { PollCard } from "./poll-card";

export function PollList() {
  const { data: pollCount, isLoading } = usePollCount();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const count = pollCount ? Number(pollCount) : 0;

  if (count === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No polls yet. Create one above!
      </p>
    );
  }

  // newest first, 0-indexed ids
  const pollIds = Array.from({ length: count }, (_, i) => BigInt(count - 1 - i));

  return (
    <div className="space-y-4">
      {pollIds.map((id) => (
        <PollCard key={id.toString()} pollId={id} />
      ))}
    </div>
  );
}
