export const voterRegistryAbi = [
  // functions
  {
    type: "function",
    name: "register",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deregister",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isRegistered",
    inputs: [{ name: "voter", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "voterCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  // events
  {
    type: "event",
    name: "VoterRegistered",
    inputs: [
      { name: "voter", type: "address", indexed: true, internalType: "address" },
    ],
  },
  {
    type: "event",
    name: "VoterDeregistered",
    inputs: [
      { name: "voter", type: "address", indexed: true, internalType: "address" },
    ],
  },
  // errors
  {
    type: "error",
    name: "AlreadyRegistered",
    inputs: [{ name: "voter", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "NotRegistered",
    inputs: [{ name: "voter", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: [{ name: "caller", type: "address", internalType: "address" }],
  },
] as const;
