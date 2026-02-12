"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { pollsAbi } from "@/abi/Polls";
import { POLLS_ADDRESS } from "@/config/contracts";
import type { Address } from "viem";

export function usePollCount() {
  return useReadContract({
    address: POLLS_ADDRESS,
    abi: pollsAbi,
    functionName: "pollCount",
  });
}

export function usePollsOwner() {
  return useReadContract({
    address: POLLS_ADDRESS,
    abi: pollsAbi,
    functionName: "owner",
  });
}

export function useIsActive(pollId: bigint) {
  return useReadContract({
    address: POLLS_ADDRESS,
    abi: pollsAbi,
    functionName: "isActive",
    args: [pollId],
  });
}

export function useGetResults(pollId: bigint) {
  return useReadContract({
    address: POLLS_ADDRESS,
    abi: pollsAbi,
    functionName: "getResults",
    args: [pollId],
  });
}

export function useHasVoted(pollId: bigint, voter: Address | undefined) {
  return useReadContract({
    address: POLLS_ADDRESS,
    abi: pollsAbi,
    functionName: "hasVoted",
    args: voter ? [pollId, voter] : undefined,
    query: { enabled: !!voter },
  });
}

export function useGetTitle(pollId: bigint) {
  return useReadContract({
    address: POLLS_ADDRESS,
    abi: pollsAbi,
    functionName: "getTitle",
    args: [pollId],
  });
}

export function useCreatePoll() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function createPoll(title: string) {
    writeContract({
      address: POLLS_ADDRESS,
      abi: pollsAbi,
      functionName: "createPoll",
      args: [title],
    });
  }

  return { createPoll, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useVote() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function vote(pollId: bigint, support: boolean) {
    writeContract({
      address: POLLS_ADDRESS,
      abi: pollsAbi,
      functionName: "vote",
      args: [pollId, support],
    });
  }

  return { vote, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useClosePoll() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function closePoll(pollId: bigint) {
    writeContract({
      address: POLLS_ADDRESS,
      abi: pollsAbi,
      functionName: "closePoll",
      args: [pollId],
    });
  }

  return { closePoll, hash, isPending, isConfirming, isSuccess, error, reset };
}
