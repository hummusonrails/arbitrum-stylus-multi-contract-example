export const pollsAbi = [
  // functions
  {
    type: "function",
    name: "setRegistry",
    inputs: [{ name: "registry", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createPoll",
    inputs: [{ name: "title", type: "string", internalType: "string" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getTitle",
    inputs: [{ name: "pollId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vote",
    inputs: [
      { name: "pollId", type: "uint256", internalType: "uint256" },
      { name: "support", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "closePoll",
    inputs: [{ name: "pollId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getResults",
    inputs: [{ name: "pollId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "yesVotes", type: "uint256", internalType: "uint256" },
      { name: "noVotes", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasVoted",
    inputs: [
      { name: "pollId", type: "uint256", internalType: "uint256" },
      { name: "voter", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isActive",
    inputs: [{ name: "pollId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pollCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registry",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
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
    name: "PollCreated",
    inputs: [
      { name: "pollId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
    ],
  },
  {
    type: "event",
    name: "VoteCast",
    inputs: [
      { name: "pollId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "voter", type: "address", indexed: true, internalType: "address" },
      { name: "support", type: "bool", indexed: false, internalType: "bool" },
    ],
  },
  {
    type: "event",
    name: "PollClosed",
    inputs: [
      { name: "pollId", type: "uint256", indexed: true, internalType: "uint256" },
    ],
  },
  // errors
  {
    type: "error",
    name: "PollNotFound",
    inputs: [{ name: "pollId", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "error",
    name: "PollNotActive",
    inputs: [{ name: "pollId", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "error",
    name: "VoterNotRegistered",
    inputs: [{ name: "voter", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "AlreadyVoted",
    inputs: [
      { name: "pollId", type: "uint256", internalType: "uint256" },
      { name: "voter", type: "address", internalType: "address" },
    ],
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: [{ name: "caller", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "RegistryNotSet",
    inputs: [],
  },
] as const;
