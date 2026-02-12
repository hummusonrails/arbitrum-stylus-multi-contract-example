"use client";

import { useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TxStatus, type TxState } from "./tx-status";
import {
  useIsRegistered,
  useRegister,
  useDeregister,
  useVoterCount,
} from "@/hooks/use-voter-registry";

export function VoterRegistration() {
  const { address, isConnected } = useAccount();
  const {
    data: isRegistered,
    isLoading: checkingRegistration,
    refetch: refetchRegistration,
  } = useIsRegistered(address);
  const {
    data: voterCount,
    isLoading: loadingCount,
    refetch: refetchCount,
  } = useVoterCount();

  const reg = useRegister();
  const dereg = useDeregister();

  // refetch on success
  useEffect(() => {
    if (reg.isSuccess || dereg.isSuccess) {
      refetchRegistration();
      refetchCount();
    }
  }, [reg.isSuccess, dereg.isSuccess, refetchRegistration, refetchCount]);

  const txState: TxState = useMemo(() => {
    const active = reg.isPending || reg.isConfirming ? reg : dereg.isPending || dereg.isConfirming ? dereg : null;
    if (!active) {
      const errored = reg.error ? reg : dereg.error ? dereg : null;
      if (errored?.error) {
        return { status: "error", message: parseContractError(errored.error) };
      }
      const succeeded = reg.isSuccess ? reg : dereg.isSuccess ? dereg : null;
      if (succeeded?.hash) {
        return { status: "success", hash: succeeded.hash };
      }
      return { status: "idle" };
    }
    if (active.isPending) return { status: "pending" };
    if (active.isConfirming && active.hash) return { status: "confirming", hash: active.hash };
    return { status: "idle" };
  }, [reg, dereg]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voter Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to register as a voter.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Voter Registration</CardTitle>
          {checkingRegistration ? (
            <Skeleton className="h-5 w-24" />
          ) : isRegistered ? (
            <Badge variant="default">Registered</Badge>
          ) : (
            <Badge variant="secondary">Not Registered</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Total registered voters:{" "}
            {loadingCount ? (
              <Skeleton className="h-4 w-8" />
            ) : (
              <span className="font-medium text-foreground">
                {voterCount?.toString() ?? "0"}
              </span>
            )}
          </p>

          <div className="flex gap-2">
            {!isRegistered ? (
              <Button
                onClick={() => {
                  reg.reset();
                  dereg.reset();
                  reg.register();
                }}
                disabled={reg.isPending || reg.isConfirming}
              >
                {reg.isPending || reg.isConfirming ? "Registering..." : "Register"}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  reg.reset();
                  dereg.reset();
                  dereg.deregister();
                }}
                disabled={dereg.isPending || dereg.isConfirming}
              >
                {dereg.isPending || dereg.isConfirming
                  ? "Deregistering..."
                  : "Deregister"}
              </Button>
            )}
          </div>
        </div>

        <TxStatus state={txState} />
      </CardContent>
    </Card>
  );
}

function parseContractError(error: Error): string {
  const msg = error.message ?? String(error);
  if (msg.includes("AlreadyRegistered")) return "You are already registered.";
  if (msg.includes("NotRegistered")) return "You are not registered.";
  if (msg.includes("User rejected")) return "Transaction rejected.";
  return msg.length > 200 ? msg.slice(0, 200) + "..." : msg;
}
