"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { voterRegistryAbi } from "@/abi/VoterRegistry";
import { VOTER_REGISTRY_ADDRESS } from "@/config/contracts";
import type { Address } from "viem";

export function useIsRegistered(voter: Address | undefined) {
  return useReadContract({
    address: VOTER_REGISTRY_ADDRESS,
    abi: voterRegistryAbi,
    functionName: "isRegistered",
    args: voter ? [voter] : undefined,
    query: { enabled: !!voter },
  });
}

export function useVoterCount() {
  return useReadContract({
    address: VOTER_REGISTRY_ADDRESS,
    abi: voterRegistryAbi,
    functionName: "voterCount",
  });
}

export function useRegistryOwner() {
  return useReadContract({
    address: VOTER_REGISTRY_ADDRESS,
    abi: voterRegistryAbi,
    functionName: "owner",
  });
}

export function useRegister() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function register() {
    writeContract({
      address: VOTER_REGISTRY_ADDRESS,
      abi: voterRegistryAbi,
      functionName: "register",
    });
  }

  return { register, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useDeregister() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function deregister() {
    writeContract({
      address: VOTER_REGISTRY_ADDRESS,
      abi: voterRegistryAbi,
      functionName: "deregister",
    });
  }

  return { deregister, hash, isPending, isConfirming, isSuccess, error, reset };
}
