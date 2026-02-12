import { http, createConfig } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import type { Chain } from "viem";

export const localDevnode: Chain = {
  id: 412346,
  name: "Arbitrum Local Devnode",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["/api/rpc"] },
  },
};

export const config = createConfig({
  chains: [arbitrumSepolia, localDevnode],
  connectors: [injected()],
  transports: {
    [arbitrumSepolia.id]: http(),
    [localDevnode.id]: http("/api/rpc"),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
