"use client";

import { useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TxStatus, type TxState } from "./tx-status";
import {
  useIsActive,
  useGetResults,
  useGetTitle,
  useHasVoted,
  useVote,
  useClosePoll,
  usePollsOwner,
} from "@/hooks/use-polls";

export function PollCard({ pollId }: { pollId: bigint }) {
  const { address } = useAccount();

  const { data: title } = useGetTitle(pollId);
  const { data: isActive, isLoading: loadingActive, refetch: refetchActive } = useIsActive(pollId);
  const {
    data: results,
    isLoading: loadingResults,
    refetch: refetchResults,
  } = useGetResults(pollId);
  const {
    data: hasVoted,
    isLoading: loadingVoted,
    refetch: refetchVoted,
  } = useHasVoted(pollId, address);
  const { data: owner } = usePollsOwner();

  const voteTx = useVote();
  const closeTx = useClosePoll();

  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

  // refetch on success
  useEffect(() => {
    if (voteTx.isSuccess) {
      refetchResults();
      refetchVoted();
    }
  }, [voteTx.isSuccess, refetchResults, refetchVoted]);

  useEffect(() => {
    if (closeTx.isSuccess) {
      refetchActive();
      refetchResults();
    }
  }, [closeTx.isSuccess, refetchActive, refetchResults]);

  const txState: TxState = useMemo(() => {
    const active =
      voteTx.isPending || voteTx.isConfirming
        ? voteTx
        : closeTx.isPending || closeTx.isConfirming
          ? closeTx
          : null;

    if (!active) {
      const errored = voteTx.error ? voteTx : closeTx.error ? closeTx : null;
      if (errored?.error) {
        return { status: "error", message: parsePollError(errored.error) };
      }
      const succeeded = voteTx.isSuccess ? voteTx : closeTx.isSuccess ? closeTx : null;
      if (succeeded?.hash) {
        return { status: "success", hash: succeeded.hash };
      }
      return { status: "idle" };
    }
    if (active.isPending) return { status: "pending" };
    if (active.isConfirming && active.hash)
      return { status: "confirming", hash: active.hash };
    return { status: "idle" };
  }, [voteTx, closeTx]);

  const yesVotes = results ? results[0] : 0n;
  const noVotes = results ? results[1] : 0n;
  const totalVotes = yesVotes + noVotes;
  const yesPercent =
    totalVotes > 0n ? Number((yesVotes * 100n) / totalVotes) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title || `Poll #${pollId.toString()}`}</CardTitle>
          {loadingActive ? (
            <Skeleton className="h-5 w-16" />
          ) : isActive ? (
            <Badge variant="default">Active</Badge>
          ) : (
            <Badge variant="secondary">Closed</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* results bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              Yes:{" "}
              {loadingResults ? (
                <Skeleton className="h-4 w-6" />
              ) : (
                yesVotes.toString()
              )}
            </span>
            <span>
              No:{" "}
              {loadingResults ? (
                <Skeleton className="h-4 w-6" />
              ) : (
                noVotes.toString()
              )}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
            {totalVotes > 0n && (
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${yesPercent}%` }}
              />
            )}
          </div>
        </div>

        {/* vote buttons */}
        {isActive && !loadingVoted && !hasVoted && address && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                voteTx.reset();
                closeTx.reset();
                voteTx.vote(pollId, true);
              }}
              disabled={voteTx.isPending || voteTx.isConfirming}
            >
              Vote Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                voteTx.reset();
                closeTx.reset();
                voteTx.vote(pollId, false);
              }}
              disabled={voteTx.isPending || voteTx.isConfirming}
            >
              Vote No
            </Button>
          </div>
        )}

        {hasVoted && (
          <p className="text-sm text-muted-foreground">You have already voted.</p>
        )}

        {/* close poll - owner only */}
        {isActive && isOwner && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              voteTx.reset();
              closeTx.reset();
              closeTx.closePoll(pollId);
            }}
            disabled={closeTx.isPending || closeTx.isConfirming}
          >
            {closeTx.isPending || closeTx.isConfirming
              ? "Closing..."
              : "Close Poll"}
          </Button>
        )}

        <TxStatus state={txState} />
      </CardContent>
    </Card>
  );
}

function parsePollError(error: Error): string {
  const msg = error.message ?? String(error);
  if (msg.includes("PollNotFound")) return "Poll not found.";
  if (msg.includes("PollNotActive")) return "Poll is no longer active.";
  if (msg.includes("VoterNotRegistered"))
    return "You must register as a voter first.";
  if (msg.includes("AlreadyVoted")) return "You have already voted on this poll.";
  if (msg.includes("Unauthorized")) return "Only the contract owner can do this.";
  if (msg.includes("RegistryNotSet")) return "Voter registry not configured.";
  if (msg.includes("User rejected")) return "Transaction rejected.";
  return msg.length > 200 ? msg.slice(0, 200) + "..." : msg;
}
