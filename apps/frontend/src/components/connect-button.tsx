"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

export function ConnectButton() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (!mounted) return <Button variant="outline" disabled>...</Button>;

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <code className="text-sm">
          {address.slice(0, 6)}...{address.slice(-4)}
        </code>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => {
        const injected = connectors.find((c) => c.id === "injected");
        if (injected) connect({ connector: injected });
      }}
    >
      Connect Wallet
    </Button>
  );
}
