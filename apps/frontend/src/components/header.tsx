import { ConnectButton } from "./connect-button";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <h1 className="text-xl font-semibold tracking-tight">
        Stylus Voting dApp
      </h1>
      <ConnectButton />
    </header>
  );
}
