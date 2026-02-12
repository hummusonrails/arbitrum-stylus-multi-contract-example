"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";

type TxState =
  | { status: "idle" }
  | { status: "pending"; message?: string }
  | { status: "confirming"; hash: string }
  | { status: "success"; hash: string }
  | { status: "error"; message: string };

export function TxStatus({ state }: { state: TxState }) {
  if (state.status === "idle") return null;

  if (state.status === "pending") {
    return (
      <Alert>
        <AlertDescription>
          {state.message ?? "Confirm in wallet..."}
        </AlertDescription>
      </Alert>
    );
  }

  if (state.status === "confirming") {
    return (
      <Alert>
        <AlertDescription>
          Waiting for confirmation...{" "}
          <code className="text-xs">{state.hash.slice(0, 10)}...</code>
        </AlertDescription>
      </Alert>
    );
  }

  if (state.status === "success") {
    return (
      <Alert>
        <AlertDescription>
          Transaction confirmed!{" "}
          <code className="text-xs">{state.hash.slice(0, 10)}...</code>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}

export type { TxState };
