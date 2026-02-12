"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TxStatus, type TxState } from "./tx-status";
import { useCreatePoll, usePollCount } from "@/hooks/use-polls";

export function CreatePoll({ onCreated }: { onCreated?: () => void }) {
  const { isConnected } = useAccount();
  const [title, setTitle] = useState("");
  const { createPoll, hash, isPending, isConfirming, isSuccess, error, reset } =
    useCreatePoll();
  const { data: pollCount, refetch: refetchCount } = usePollCount();

  useEffect(() => {
    if (isSuccess) {
      refetchCount();
      setTitle("");
      onCreated?.();
    }
  }, [isSuccess, refetchCount, onCreated]);

  const txState: TxState = useMemo(() => {
    if (isPending) return { status: "pending" };
    if (isConfirming && hash) return { status: "confirming", hash };
    if (error) return { status: "error", message: parseError(error) };
    if (isSuccess && hash) return { status: "success", hash };
    return { status: "idle" };
  }, [isPending, isConfirming, isSuccess, hash, error]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Create Poll</CardTitle>
          <span className="text-sm text-muted-foreground">
            {pollCount !== undefined ? `${pollCount.toString()} polls total` : ""}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="What should we vote on?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!isConnected || isPending || isConfirming}
        />
        <Button
          onClick={() => {
            reset();
            createPoll(title);
          }}
          disabled={!isConnected || !title.trim() || isPending || isConfirming}
        >
          {isPending || isConfirming ? "Creating..." : "Create Poll"}
        </Button>
        <TxStatus state={txState} />
      </CardContent>
    </Card>
  );
}

function parseError(error: Error): string {
  const msg = error.message ?? String(error);
  if (msg.includes("User rejected")) return "Transaction rejected.";
  return msg.length > 200 ? msg.slice(0, 200) + "..." : msg;
}
