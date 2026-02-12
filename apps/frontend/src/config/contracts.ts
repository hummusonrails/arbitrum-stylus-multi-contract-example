import type { Address } from "viem";

export const VOTER_REGISTRY_ADDRESS = (process.env
  .NEXT_PUBLIC_VOTER_REGISTRY_ADDRESS ?? "0x") as Address;

export const POLLS_ADDRESS = (process.env.NEXT_PUBLIC_POLLS_ADDRESS ??
  "0x") as Address;
